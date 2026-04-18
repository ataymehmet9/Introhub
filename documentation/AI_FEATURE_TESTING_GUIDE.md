# AI Feature Testing Guide

## Prerequisites

Before testing, ensure:

1. ✅ Database migration has been applied (`pnpm drizzle-kit push`)
2. ✅ Environment variables are set in `.env.local`:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   AI_MODEL=llama-3.3-70b-versatile
   AI_MAX_TOKENS=500
   AI_TEMPERATURE=0.7
   AI_RATE_LIMIT_PER_HOUR=10
   ```
3. ✅ Development server is running (`pnpm dev`)
4. ✅ You have both a Pro user and a Free user account for testing

---

## Test Scenarios

### 1. Free User Flow

**Goal**: Verify free users see the AI button but are redirected to billing

**Steps**:

1. Log in as a Free user
2. Navigate to Search page
3. Search for a contact
4. Click "Request Introduction" on a search result
5. Modal opens with template message
6. Look for "Enhance with AI 🔒 (Pro)" button
7. Click the button
8. **Expected**: Redirected to `/me/billing` page
9. **PostHog Event**: `ai_upgrade_prompt_clicked` should be tracked

**Success Criteria**:

- ✅ Button shows lock icon and "(Pro)" label
- ✅ Clicking redirects to billing page
- ✅ No API call is made
- ✅ PostHog event is captured

---

### 2. Pro User - First Generation

**Goal**: Verify Pro users can generate AI messages

**Steps**:

1. Log in as a Pro user
2. Navigate to Search page
3. Search for a contact
4. Click "Request Introduction"
5. Modal opens with template message
6. Look for "Enhance with AI (10/10 left)" button
7. Click the button
8. **Expected**:
   - Loading spinner appears with "Generating personalized message..."
   - After 2-3 seconds, comparison view appears
   - Two cards shown: "Template" and "✨ AI Generated"
   - AI Generated card is selected by default (highlighted border)
   - "Regenerate" and "Continue with Selected" buttons appear
9. Review the AI-generated message
10. Click "Continue with Selected"
11. **Expected**: Returns to single message view with AI message
12. Click "Send Request"

**Success Criteria**:

- ✅ Loading state shows during generation
- ✅ Comparison view displays both messages
- ✅ AI message is personalized (includes user's name, company, position)
- ✅ AI message mentions the contact's name and details
- ✅ Rate limit counter updates to "(9/10 left)"
- ✅ PostHog events tracked:
  - `ai_generation_initiated`
  - `ai_generation_completed` (success: true)
  - `ai_message_selected`
  - `introduction_sent` (usedAI: true)

---

### 3. Message Comparison & Selection

**Goal**: Verify users can compare and select between template and AI message

**Steps**:

1. Generate an AI message (follow Test 2 steps 1-8)
2. In comparison view, click on "Template" card
3. **Expected**: Template card gets highlighted border and "✓ Selected" badge
4. Click on "AI Generated" card
5. **Expected**: AI card gets highlighted border and "✓ Selected" badge
6. Click "Continue with Selected"
7. **Expected**: Returns to single view with AI message
8. Click "Edit Message" to verify the correct message is loaded

**Success Criteria**:

- ✅ Cards are clickable and show visual feedback
- ✅ Only one card can be selected at a time
- ✅ "Continue" button uses the selected message
- ✅ PostHog events tracked for each selection

---

### 4. Regeneration

**Goal**: Verify users can regenerate AI messages

**Steps**:

1. Generate an AI message (follow Test 2 steps 1-8)
2. In comparison view, click "Regenerate (9/10 left)" button
3. **Expected**:
   - Button shows loading spinner
   - New AI message replaces the previous one
   - AI card remains selected
   - Rate limit counter updates to "(8/10 left)"
4. Regenerate again
5. **Expected**: Counter shows "(7/10 left)"

**Success Criteria**:

- ✅ Regeneration creates a new message
- ✅ Rate limit counter decrements correctly
- ✅ PostHog event `ai_generation_regenerated` is tracked
- ✅ Previous AI message is replaced (not stored)

---

### 5. Rate Limit Enforcement

**Goal**: Verify rate limiting works correctly

**Steps**:

1. Generate AI messages 10 times (use regenerate button)
2. After 10th generation, rate limit counter shows "(0/10 left)"
3. Try to regenerate again
4. **Expected**:
   - Button is disabled
   - Toast notification: "You've used all your generations this hour. Try again in X minutes."
5. Close modal and open a new introduction request
6. **Expected**: "Enhance with AI (0/10 left)" button is disabled
7. Wait 1 hour (or manually update database for testing)
8. **Expected**: Rate limit resets, counter shows "(10/10 left)"

**Success Criteria**:

- ✅ Rate limit enforced at 10 generations per hour
- ✅ Button disabled when limit reached
- ✅ Clear error message shown
- ✅ Rate limit resets after 1 hour

---

### 6. Error Handling

**Goal**: Verify graceful error handling

**Test 6a: Network Error**

1. Disconnect internet or block Groq API
2. Click "Enhance with AI"
3. **Expected**:
   - Loading state appears
   - After timeout, error toast: "Failed to generate AI message. Please try again."
   - Returns to single view with template message
   - "Enhance with AI" button remains visible for retry

**Test 6b: Invalid Contact Data**

1. Manually trigger generation with missing contact details
2. **Expected**: Validation error or graceful fallback

**Test 6c: API Rate Limit (Groq)**

1. Exhaust Groq's daily limit (14,400 requests)
2. **Expected**: Error toast with appropriate message

**Success Criteria**:

- ✅ Errors don't crash the app
- ✅ User can retry after errors
- ✅ Template message remains available
- ✅ Error messages are user-friendly

---

### 7. Message Editing

**Goal**: Verify users can edit AI-generated messages

**Steps**:

1. Generate an AI message
2. Click "Continue with Selected"
3. Click "Edit Message"
4. Modify the message
5. Click "Send Request"
6. **Expected**: PostHog event `introduction_sent` includes `messageEdited: true`

**Success Criteria**:

- ✅ AI message can be edited like template
- ✅ Character counter works correctly
- ✅ Validation applies to edited message
- ✅ Edit tracking works in analytics

---

### 8. Mobile Responsiveness

**Goal**: Verify UI works on mobile devices

**Steps**:

1. Open app on mobile device or use browser dev tools (responsive mode)
2. Follow Test 2 steps to generate AI message
3. In comparison view, verify:
   - Cards are stacked vertically
   - AI Generated card appears first (top)
   - Template card appears second (bottom)
   - Both cards are fully readable
   - Buttons are accessible

**Success Criteria**:

- ✅ Comparison view stacks on mobile
- ✅ AI message shown first on mobile
- ✅ All text is readable
- ✅ Buttons are touch-friendly

---

### 9. PostHog Analytics Verification

**Goal**: Verify all analytics events are tracked correctly

**Steps**:

1. Open PostHog dashboard
2. Perform various actions (generate, select, regenerate, send)
3. Check for these events:
   - `ai_generation_initiated`
   - `ai_generation_completed`
   - `ai_generation_regenerated`
   - `ai_message_selected`
   - `template_selected`
   - `introduction_sent`
   - `ai_upgrade_prompt_clicked`

**Success Criteria**:

- ✅ All events appear in PostHog
- ✅ Events include correct properties
- ✅ User identification works
- ✅ Timestamps are accurate

---

### 10. Database Verification

**Goal**: Verify AI generations are logged correctly

**Steps**:

1. Generate several AI messages
2. Query the database:
   ```sql
   SELECT * FROM ai_generations
   ORDER BY created_at DESC
   LIMIT 10;
   ```
3. Verify:
   - Each generation is logged
   - `success` field is true for successful generations
   - `tokens_used` and `response_time_ms` are populated
   - `metadata` contains contact and user details
   - `error_message` is null for successful generations

**Success Criteria**:

- ✅ All generations logged in database
- ✅ Metadata is complete and accurate
- ✅ Performance metrics captured
- ✅ Errors are logged with details

---

## Performance Benchmarks

Expected performance metrics:

- **Response Time**: 2-4 seconds for generation
- **Token Usage**: 300-500 tokens per message
- **Success Rate**: >95% under normal conditions
- **Rate Limit**: Exactly 10 per hour per user

---

## Common Issues & Solutions

### Issue: "Rate limit reached" immediately

**Solution**: Check database for stuck generations. Clear old records:

```sql
DELETE FROM ai_generations
WHERE created_at < NOW() - INTERVAL '1 hour';
```

### Issue: AI message is generic/poor quality

**Solution**:

1. Check if contact data is complete
2. Review prompt in `ai.service.ts`
3. Adjust temperature or max_tokens in `.env.local`

### Issue: PostHog events not appearing

**Solution**:

1. Verify PostHog is initialized in `__root.tsx`
2. Check browser console for errors
3. Ensure PostHog API key is correct

### Issue: Comparison view doesn't appear

**Solution**:

1. Check browser console for React errors
2. Verify `viewMode` state is updating
3. Check if `aiMessage` is set correctly

---

## Manual Testing Checklist

Before marking the feature as complete, verify:

- [ ] Free user sees locked button and redirects to billing
- [ ] Pro user can generate AI messages
- [ ] Comparison view displays correctly
- [ ] Message selection works (both cards clickable)
- [ ] Regeneration works and decrements rate limit
- [ ] Rate limit enforced at 10/hour
- [ ] Error handling works gracefully
- [ ] Message editing works after AI generation
- [ ] Mobile responsive layout works
- [ ] PostHog events are tracked
- [ ] Database logs all generations
- [ ] Performance meets benchmarks
- [ ] UI is polished and intuitive

---

## Next Steps After Testing

1. **If bugs found**: Document in GitHub issues, fix, and retest
2. **If performance issues**: Optimize prompts, adjust timeouts, consider caching
3. **If UX issues**: Iterate on design, gather user feedback
4. **If all tests pass**:
   - Write automated tests
   - Update user documentation
   - Plan rollout strategy
   - Monitor production metrics

---

## Production Monitoring

After deployment, monitor:

- **Error Rate**: Should be <5%
- **Response Time**: P95 should be <5 seconds
- **Adoption Rate**: Track % of Pro users using AI
- **Selection Rate**: Track AI vs Template selection
- **Groq API Usage**: Ensure within free tier limits

Set up alerts for:

- Error rate >10%
- Response time >10 seconds
- Rate limit errors >5% of requests
- Groq API approaching daily limit
