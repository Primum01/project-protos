import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleWithIdempotency,
  isValidIdempotencyKey,
  canonicalizeJson,
  computeRequestHash,
  computeRecordId,
  IdempotencyStorage,
} from '../api/_lib/idempotency.ts'

// Mock Response Helper
function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value
      return this
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('Idempotency System Tests', () => {
  let storage

  beforeEach(() => {
    storage = new IdempotencyStorage({ inMemoryOnly: true })
    storage.clearMemoryStore()
  })

  // ── Key Validation & Canonicalization ─────────────────────────────────────
  describe('Key Validation & Payload Canonicalization', () => {
    it('Rejects keys shorter than 16 characters or with invalid characters', () => {
      assert.equal(isValidIdempotencyKey(''), false)
      assert.equal(isValidIdempotencyKey('short-key'), false)
      assert.equal(isValidIdempotencyKey('123456789012345'), false) // 15 chars
      assert.equal(isValidIdempotencyKey('invalid space in key 123456'), false)
      assert.equal(isValidIdempotencyKey(null), false)
      assert.equal(isValidIdempotencyKey(undefined), false)
    })

    it('Accepts valid UUID v4 and safe alphanumeric keys >= 16 characters', () => {
      assert.equal(isValidIdempotencyKey('b8b32948-4cb5-4e78-9e5c-750c058cbe7b'), true)
      assert.equal(isValidIdempotencyKey('custom_key_1234567890_test'), true)
      assert.equal(isValidIdempotencyKey('session:client-998877665544'), true)
    })

    it('Canonicalizes JSON objects with unordered keys to produce identical hashes', () => {
      const payloadA = { b: 2, a: 1, c: { y: 20, x: 10 } }
      const payloadB = { c: { x: 10, y: 20 }, a: 1, b: 2 }
      assert.equal(canonicalizeJson(payloadA), canonicalizeJson(payloadB))
      assert.equal(computeRequestHash(payloadA), computeRequestHash(payloadB))
    })

    it('Computes deterministic record IDs from scope, method, endpoint, and key', () => {
      const id1 = computeRecordId('user:123', 'POST', '/api/payments/create', 'key-abc-1234567890')
      const id2 = computeRecordId('user:123', 'POST', '/api/payments/create', 'key-abc-1234567890')
      assert.equal(id1, id2)
      assert.equal(typeof id1, 'string')
      assert.equal(id1.length, 64) // SHA-256 hex
    })
  })

  // ── Test 1: Normal Request ────────────────────────────────────────────────
  it('Test 1 — Normal request: executes once, returns success, and saves record', async () => {
    let executions = 0
    const req = {
      method: 'POST',
      url: '/api/contact',
      headers: { 'idempotency-key': '00000000-0000-0000-0000-000000000001' },
      body: { name: 'John Doe', email: 'john@example.com', message: 'Hello' },
    }
    const res = createMockResponse()

    await handleWithIdempotency(
      req,
      res,
      { endpoint: '/api/contact', required: true },
      async () => {
        executions++
        return { status: 200, body: { success: true, id: 'msg_123' } }
      },
      storage,
    )

    assert.equal(executions, 1)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.id, 'msg_123')

    // Confirm stored in idempotency storage
    const recordId = computeRecordId('anon:unknown', 'POST', '/api/contact', req.headers['idempotency-key'])
    const saved = await storage.get(recordId)
    assert.ok(saved)
    assert.equal(saved.status, 'COMPLETED')
    assert.equal(saved.responseStatus, 200)
    assert.equal(saved.responseBody.id, 'msg_123')
  })

  // ── Test 2: Exact Duplicate Request ───────────────────────────────────────
  it('Test 2 — Exact duplicate: operation executes only once and returns original result', async () => {
    let executions = 0
    const key = '00000000-0000-0000-0000-000000000002'
    const payload = { amount: 5000, currency: 'KES', description: 'Tour booking' }

    // First request
    const req1 = {
      method: 'POST',
      url: '/api/payments/create',
      headers: { 'idempotency-key': key },
      body: payload,
    }
    const res1 = createMockResponse()
    await handleWithIdempotency(
      req1,
      res1,
      { endpoint: '/api/payments/create', required: true },
      async () => {
        executions++
        return { status: 201, body: { success: true, txnId: 'txn_999' } }
      },
      storage,
    )

    assert.equal(executions, 1)
    assert.equal(res1.statusCode, 201)
    assert.equal(res1.body.txnId, 'txn_999')

    // Second exact duplicate request
    const req2 = {
      method: 'POST',
      url: '/api/payments/create',
      headers: { 'idempotency-key': key },
      body: payload,
    }
    const res2 = createMockResponse()
    await handleWithIdempotency(
      req2,
      res2,
      { endpoint: '/api/payments/create', required: true },
      async () => {
        executions++
        return { status: 201, body: { success: true, txnId: 'txn_DUPLICATE_ERROR' } }
      },
      storage,
    )

    // Execution counter must NOT increment
    assert.equal(executions, 1)
    assert.equal(res2.statusCode, 201)
    assert.equal(res2.body.txnId, 'txn_999')
    assert.equal(res2.headers['idempotent-replayed'], 'true')
  })

  // ── Test 3: Concurrent Duplicate Requests ──────────────────────────────────
  it('Test 3 — Concurrent duplicate: only one execution occurs under simultaneous requests', async () => {
    let executions = 0
    const key = '00000000-0000-0000-0000-000000000003'
    const payload = { orderId: 'ord_555' }

    const makeCall = async () => {
      const req = {
        method: 'POST',
        url: '/api/orders',
        headers: { 'idempotency-key': key },
        body: payload,
      }
      const res = createMockResponse()
      await handleWithIdempotency(
        req,
        res,
        { endpoint: '/api/orders', required: true },
        async () => {
          executions++
          // Artificial processing delay
          await new Promise((r) => setTimeout(r, 20))
          return { status: 200, body: { success: true, orderId: 'ord_555' } }
        },
        storage,
      )
      return res
    }

    // Launch both concurrently
    const [resA, resB] = await Promise.all([makeCall(), makeCall()])

    assert.equal(executions, 1)
    // One will get the 200, the concurrent duplicate receives either 200 (if resolved) or 409 in-progress
    assert.ok(resA.statusCode === 200 || resA.statusCode === 409)
    assert.ok(resB.statusCode === 200 || resB.statusCode === 409)
  })

  // ── Test 4: Same Key, Different Payload ───────────────────────────────────
  it('Test 4 — Same key, different payload: returns 409 Conflict without executing', async () => {
    let executions = 0
    const key = '00000000-0000-0000-0000-000000000004'

    // Initial request
    const req1 = {
      method: 'POST',
      url: '/api/contact',
      headers: { 'idempotency-key': key },
      body: { email: 'user@example.com', message: 'Original message' },
    }
    const res1 = createMockResponse()
    await handleWithIdempotency(
      req1,
      res1,
      { endpoint: '/api/contact', required: true },
      async () => {
        executions++
        return { status: 200, body: { success: true } }
      },
      storage,
    )
    assert.equal(executions, 1)

    // Reusing the same key with altered payload
    const req2 = {
      method: 'POST',
      url: '/api/contact',
      headers: { 'idempotency-key': key },
      body: { email: 'different@example.com', message: 'Altered message' },
    }
    const res2 = createMockResponse()
    await handleWithIdempotency(
      req2,
      res2,
      { endpoint: '/api/contact', required: true },
      async () => {
        executions++
        return { status: 200, body: { success: true } }
      },
      storage,
    )

    assert.equal(executions, 1) // Did not execute
    assert.equal(res2.statusCode, 409)
    assert.match(res2.body.error, /conflict/i)
  })

  // ── Test 5: Failed Operation Recovery ─────────────────────────────────────
  it('Test 5 — Failed operation: does not permanently lock the key, allowing retry', async () => {
    let attempts = 0
    const key = '00000000-0000-0000-0000-000000000005'
    const payload = { test: true }

    // First attempt fails with 500
    const req1 = {
      method: 'POST',
      url: '/api/action',
      headers: { 'idempotency-key': key },
      body: payload,
    }
    const res1 = createMockResponse()
    await handleWithIdempotency(
      req1,
      res1,
      { endpoint: '/api/action', required: true },
      async () => {
        attempts++
        return { status: 500, body: { error: 'Temporary service error' } }
      },
      storage,
    )

    assert.equal(attempts, 1)
    assert.equal(res1.statusCode, 500)

    // Second retry attempt with the same key should be permitted
    const req2 = {
      method: 'POST',
      url: '/api/action',
      headers: { 'idempotency-key': key },
      body: payload,
    }
    const res2 = createMockResponse()
    await handleWithIdempotency(
      req2,
      res2,
      { endpoint: '/api/action', required: true },
      async () => {
        attempts++
        return { status: 200, body: { success: true, recovered: true } }
      },
      storage,
    )

    assert.equal(attempts, 2)
    assert.equal(res2.statusCode, 200)
    assert.equal(res2.body.recovered, true)
  })

  // ── Test 6: Missing Required Key ──────────────────────────────────────────
  it('Test 6 — Missing key: rejects with 400 Bad Request when header is required', async () => {
    let executions = 0
    const req = {
      method: 'POST',
      url: '/api/payments/create',
      headers: {}, // No idempotency-key header
      body: { amount: 100 },
    }
    const res = createMockResponse()

    await handleWithIdempotency(
      req,
      res,
      { endpoint: '/api/payments/create', required: true },
      async () => {
        executions++
        return { status: 200, body: { success: true } }
      },
      storage,
    )

    assert.equal(executions, 0)
    assert.equal(res.statusCode, 400)
    assert.match(res.body.error, /missing required idempotency-key/i)
  })

  // ── Test 7: User Scoping / Cross-User Isolation ───────────────────────────
  it('Test 7 — Different users: same key used by two different users executes independently', async () => {
    let executions = 0
    const sharedKey = '00000000-0000-0000-0000-000000000007'

    // User A executes
    const reqUserA = {
      method: 'POST',
      url: '/api/bookings',
      headers: { 'idempotency-key': sharedKey },
      body: { slot: '10:00' },
      user: { uid: 'user_A' },
    }
    const resA = createMockResponse()
    await handleWithIdempotency(
      reqUserA,
      resA,
      { endpoint: '/api/bookings', required: true },
      async () => {
        executions++
        return { status: 200, body: { user: 'user_A', booked: true } }
      },
      storage,
    )
    assert.equal(executions, 1)
    assert.equal(resA.body.user, 'user_A')

    // User B uses the exact same key string
    const reqUserB = {
      method: 'POST',
      url: '/api/bookings',
      headers: { 'idempotency-key': sharedKey },
      body: { slot: '10:00' },
      user: { uid: 'user_B' },
    }
    const resB = createMockResponse()
    await handleWithIdempotency(
      reqUserB,
      resB,
      { endpoint: '/api/bookings', required: true },
      async () => {
        executions++
        return { status: 200, body: { user: 'user_B', booked: true } }
      },
      storage,
    )

    // User B's request executes independently without colliding with User A
    assert.equal(executions, 2)
    assert.equal(resB.body.user, 'user_B')
  })

  // ── Test 8: Abandoned Lock / Crash Recovery ───────────────────────────────
  it('Test 8 — Abandoned lock recovery: stale PROCESSING record can be safely recovered', async () => {
    let executions = 0
    const key = '00000000-0000-0000-0000-000000000008'
    const recordId = computeRecordId('anon:unknown', 'POST', '/api/work', key)

    // Simulate an abandoned crash: record stuck in PROCESSING from 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 120 * 1000).toISOString()
    await storage.create({
      id: recordId,
      key,
      scope: 'anon:unknown',
      endpoint: '/api/work',
      method: 'POST',
      requestHash: computeRequestHash({ task: 1 }),
      status: 'PROCESSING',
      createdAt: twoMinutesAgo,
      updatedAt: twoMinutesAgo,
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    })

    const req = {
      method: 'POST',
      url: '/api/work',
      headers: { 'idempotency-key': key },
      body: { task: 1 },
    }
    const res = createMockResponse()

    await handleWithIdempotency(
      req,
      res,
      { endpoint: '/api/work', required: true, processingTimeoutSeconds: 60 },
      async () => {
        executions++
        return { status: 200, body: { success: true, recoveredFromCrash: true } }
      },
      storage,
    )

    assert.equal(executions, 1)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.recoveredFromCrash, true)
  })
})
