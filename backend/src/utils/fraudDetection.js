/**
 * Fraud Detection Rules Engine
 * Off-chain validation before on-chain submission
 */

const fraudRules = {
  // Rule 1: Hash deduplication (check against known fraudulent hashes)
  knownFraudHashes: new Set(),

  // Rule 2: Credit threshold validation
  maxCreditsPerSubmission: 1000000,
  minCreditsPerSubmission: 1,

  // Rule 3: Unrealistic values
  suspiciousCreditThreshold: 50000,
};

function checkFraud(fileHash, creditsRequested) {
  let riskScore = 0;
  let reasons = [];

  // Check 1: Known fraud hashes
  if (fraudRules.knownFraudHashes.has(fileHash)) {
    riskScore += 100;
    reasons.push("Hash matches known fraudulent submission");
  }

  // Check 2: Duplicate/empty hash
  if (!fileHash || fileHash.length < 10) {
    riskScore += 50;
    reasons.push("Invalid file hash");
  }

  // Check 3: Credits out of range
  if (creditsRequested < fraudRules.minCreditsPerSubmission || creditsRequested > fraudRules.maxCreditsPerSubmission) {
    riskScore += 75;
    reasons.push(`Credits out of valid range [${fraudRules.minCreditsPerSubmission}, ${fraudRules.maxCreditsPerSubmission}]`);
  }

  // Check 4: Suspiciously high credits
  if (creditsRequested > fraudRules.suspiciousCreditThreshold) {
    riskScore += 30;
    reasons.push(`Suspiciously high credit amount: ${creditsRequested}`);
  }

  const isFraud = riskScore >= 50;

  return {
    isFraud,
    riskScore,
    reason: reasons.length > 0 ? reasons.join("; ") : "No fraud detected",
  };
}

function addKnownFraudHash(hash) {
  fraudRules.knownFraudHashes.add(hash);
}

module.exports = {
  checkFraud,
  addKnownFraudHash,
};
