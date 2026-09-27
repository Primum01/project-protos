import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import {
  hashOtpCode,
  saveOtpRecord,
  getOtpRecord,
  incrementOtpAttempts,
  deleteOtpRecord,
  generateVerifiedToken,
  verifySignedToken,
  memoryOtpStore,
} from '../api/_lib/otpStore.ts'

const TEST_EMAIL = 'team@twinspace360.com'

describe('Server-Side 2FA Email OTP System Tests', () => {
  beforeEach(() => {
    memoryOtpStore.clear()
  })

  describe('Cryptographic Code Hashing & Salt Safety', () => {
    it('produces deterministic SHA-256 HMAC hash for the same code and email', () => {
      const hash1 = hashOtpCode('481920', TEST_EMAIL)
      const hash2 = hashOtpCode('481920', TEST_EMAIL)
      assert.equal(hash1, hash2)
      assert.equal(hash1.length, 64)
    })

    it('produces completely different hashes for different codes', () => {
      const hash1 = hashOtpCode('111111', TEST_EMAIL)
      const hash2 = hashOtpCode('222222', TEST_EMAIL)
      assert.notEqual(hash1, hash2)
    })

    it('produces completely different hashes for different emails with same code', () => {
      const hash1 = hashOtpCode('123456', 'team@twinspace360.com')
      const hash2 = hashOtpCode('123456', 'attacker@example.com')
      assert.notEqual(hash1, hash2)
    })
  })

  describe('Record Storage & Retrieval', () => {
    it('stores and retrieves active OTP record accurately', async () => {
      const code = '592813'
      const codeHash = hashOtpCode(code, TEST_EMAIL)
      const expiresAt = Date.now() + 5 * 60 * 1000

      await saveOtpRecord({
        codeHash,
        email: TEST_EMAIL,
        attempts: 0,
        expiresAt,
        createdAt: Date.now(),
      })

      const retrieved = await getOtpRecord(TEST_EMAIL)
      assert.ok(retrieved)
      assert.equal(retrieved.codeHash, codeHash)
      assert.equal(retrieved.email, TEST_EMAIL)
      assert.equal(retrieved.attempts, 0)
    })

    it('returns null if no OTP record exists for email', async () => {
      const record = await getOtpRecord('unknown@twinspace360.com')
      assert.equal(record, null)
    })
  })

  describe('Brute-Force & Attempt Throttling', () => {
    it('increments attempts on failed verification', async () => {
      const codeHash = hashOtpCode('123456', TEST_EMAIL)
      await saveOtpRecord({
        codeHash,
        email: TEST_EMAIL,
        attempts: 0,
        expiresAt: Date.now() + 300000,
        createdAt: Date.now(),
      })

      const attempt1 = await incrementOtpAttempts(TEST_EMAIL)
      assert.equal(attempt1, 1)

      const attempt2 = await incrementOtpAttempts(TEST_EMAIL)
      assert.equal(attempt2, 2)

      const record = await getOtpRecord(TEST_EMAIL)
      assert.equal(record.attempts, 2)
    })

    it('deletes the OTP record upon explicit consumption or lockout', async () => {
      const codeHash = hashOtpCode('987654', TEST_EMAIL)
      await saveOtpRecord({
        codeHash,
        email: TEST_EMAIL,
        attempts: 0,
        expiresAt: Date.now() + 300000,
        createdAt: Date.now(),
      })

      await deleteOtpRecord(TEST_EMAIL)
      const record = await getOtpRecord(TEST_EMAIL)
      assert.equal(record, null)
    })
  })

  describe('Session Token Issuance & Cryptographic Validation', () => {
    it('generates a valid, verifiable session token', () => {
      const token = generateVerifiedToken(TEST_EMAIL)
      assert.ok(token)
      assert.ok(token.length > 30)

      const isValid = verifySignedToken(token)
      assert.equal(isValid, true)
    })

    it('rejects tampered tokens', () => {
      const token = generateVerifiedToken(TEST_EMAIL)
      // Tamper with the base64 string
      const tampered = token.slice(0, -4) + 'AAAA'
      const isValid = verifySignedToken(tampered)
      assert.equal(isValid, false)
    })

    it('rejects tokens issued for non-admin emails', () => {
      const fakeToken = generateVerifiedToken('attacker@evil.com')
      const isValid = verifySignedToken(fakeToken)
      assert.equal(isValid, false)
    })
  })

  describe('Single-Use Invalidation & Timing Safe Comparison', () => {
    it('timingSafeEqual correctly matches identical hashes and rejects mismatches', () => {
      const correctHash = hashOtpCode('839201', TEST_EMAIL)
      const candidateHashValid = hashOtpCode('839201', TEST_EMAIL)
      const candidateHashInvalid = hashOtpCode('999999', TEST_EMAIL)

      const matchValid = crypto.timingSafeEqual(
        Buffer.from(candidateHashValid),
        Buffer.from(correctHash),
      )
      assert.equal(matchValid, true)

      const matchInvalid = crypto.timingSafeEqual(
        Buffer.from(candidateHashInvalid),
        Buffer.from(correctHash),
      )
      assert.equal(matchInvalid, false)
    })
  })
})
