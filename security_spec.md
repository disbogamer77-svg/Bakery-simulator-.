# Security Specification & Invariants (TDD)

## 1. Data Invariants
1. A user profile document can only be created if the document ID matches `request.auth.uid`.
2. A user's `role` or privilege fields cannot be set or mutated by the user themselves.
3. Captures must have a valid `photo` of type string (under 12MB base64), a valid `timestamp`, and an `itemType` belonging to the approved enum.
4. If a capture has a `userId`, it must match `request.auth.uid`.
5. Non-owners are forbidden from modifying or deleting someone else's captures.
6. Public captures (without a `userId`) can be deleted by anyone or be protected depending on the administrative concept.

## 2. The "Dirty Dozen" Payloads (Adversarial Test Scenarios)
1. **Email Spoofing / Identity Theft**: Registering `/users/attacker-uid` with `email: 'admin@baker.com'` without email verification.
2. **Path Privilege Escalation**: Creating/editing `/users/some-user` by setting an unrequested admin or moderator flag.
3. **Capture Hijacking**: Updating a capture document with a different `userId` to steal ownership.
4. **Volume Flood**: Writing a capture with a 50MB random string in the `photo` field.
5. **ID Poisoning / Path injection**: Creating a capture with a document ID containing special/malicious characters.
6. **Bypassing Enum validation**: Creating a capture with `itemType: 'toxic_waste'`.
7. **Negative Temperature**: Creating a capture with `temperature: -999` (violating sanity range).
8. **Impersonated Author**: Writing a capture with `userId: 'victim-uid'` when authenticated as `attacker-uid`.
9. **Unauthenticated Read/Write**: Attempting to list captures or create a capture without being signed in (when strict auth is required).
10. **Terminal State Mutation**: Editing an "official" certified capture's metadata after it was sealed.
11. **Malicious Array Poisoning**: Attempting to inject nested array payloads to crash the deserializer.
12. **Timestamp Spoofing**: Setting `createdAt` or `timestamp` to a future date to float at the top of the feed.

## 3. Recommended Security Rules Architecture
We will write `firestore.rules` containing global validators, the `isValidId` sanity guard, and the strict schema mapping for `users` and `captures`.
