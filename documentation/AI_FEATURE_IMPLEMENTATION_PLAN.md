# AI-Powered Introduction Message Generation - Implementation Plan

## Overview

This document outlines the complete implementation plan for integrating AI-powered introduction message generation into the IntroHub application using TanStack AI with Groq as the provider.

## Feature Summary

Users can generate personalized introduction request messages using AI instead of relying on generic templates. The feature is available to Pro users with rate limiting (10 generations/hour) and includes comprehensive error handling, analytics tracking, and a comparison UI.

---

## Architecture Decisions

### 1. AI Provider Stack

- **Framework**: TanStack AI (provider-agnostic, TypeScript-first)
- **Provider**: Groq (FREE tier: 14,400 requests/day)
- **Model**: Llama 3.3 70B Versatile
- **Rationale**: Avoid Vercel dependencies, free tier sufficient for MVP, excellent performance

### 2. Database Schema

- **Table**: `ai_generations`
- **Purpose**: Track all generation attempts for analytics, rate limiting, and debugging
- **Fields**: userId, generationType, targetContactId, success, errorMessage, tokensUsed, responseTimeMs, metadata
- **Status**: ✅ Completed (Migration 0009)

### 3. Rate Limiting

- **Limit**: 10 generations per hour per user
- **Implementation**: Database-tracked with hourly rolling window
- **UI Feedback**: Show remaining count on button, disable when exhausted
- **Status**: ✅ Completed

### 4. Plan Restrictions

- **Pro Users**: Full access to AI generation
- **Free Users**: See button with lock icon, redirected to `/me/billing` on click
- **UI Differentiation**: Button shows "Enhance with AI 🔒 (Pro)" for free users

---

## User Experience Flow

### Initial State (Modal Opens)

1. User clicks "Request Introduction" on a search result
2. Modal opens showing:
   - Contact information card
   - Template message in view mode
   - "Enhance with AI" button (with Pro badge for free users)
   - Rate limit counter (e.g., "8/10 left") for Pro users

### AI Generation Flow (Pro Users)

1. User clicks "Enhance with AI" button
2. Loading state:
   - Spinner overlay appears on message area
   - Modal remains interactive (can cancel)
   - Button shows "Generating..." with spinner
3. On success:
   - Comparison view appears with two cards side-by-side (stacked on mobile)
   - **Left card**: Template message with "Template" badge
   - **Right card**: AI-generated message with "✨ AI Generated" badge
   - Cards are clickable to select (highlight border on selection)
   - Selected card shows "✓ Selected" badge
   - "Continue" button at bottom to proceed with selected message
   - "Regenerate" button to create new AI message (counts toward rate limit)
4. After selection:
   - Returns to single-message view with selected message
   - User can click "Edit Message" to customize
   - User can click "Send Request" to submit

### Error Handling

- **On failure**: Keep template message, show error toast, keep "Enhance with AI" button for retry
- **Rate limit reached**: Disable button, show toast with time until reset
- **Free user clicks**: Redirect to `/me/billing` page

### Regeneration

- "Regenerate" button available in comparison view
- Replaces current AI message with new generation
- Counts toward rate limit
- Disabled if rate limit reached
- Tracked in PostHog as `ai_generation_regenerated`

---

## UI Components & Styling

### Icons (Tabler Icons)

- **Main button**: `TbSparkles` - AI enhancement
- **Loading**: `TbLoader` - spinning indicator
- **AI card badge**: `TbSparkles` - AI-generated indicator
- **Template card**: `TbFileText` - template indicator
- **Lock icon**: `TbLock` - Pro feature (links to `/me/billing`)
- **Rate limit**: `TbClock` - time-based limit indicator
- **Regenerate**: `TbRefresh` - regenerate action

### Button States

```typescript
// Pro user with generations remaining
<Button icon={<TbSparkles />}>
  Enhance with AI (8/10 left)
</Button>

// Pro user at rate limit
<Button icon={<TbSparkles />} disabled>
  Enhance with AI (0/10 left)
</Button>

// Free user
<Button icon={<TbSparkles />} variant="outlined">
  Enhance with AI <TbLock /> (Pro)
</Button>

// Loading state
<Button icon={<TbLoader className="animate-spin" />} disabled>
  Generating...
</Button>
```

### Comparison View Layout

```
Desktop (side-by-side):
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ 📄 Template          │  │ ✨ AI Generated      │    │
│  │ [Message content]    │  │ [Message content]    │    │
│  │                      │  │                      │    │
│  │ [Click to select]    │  │ [✓ Selected]         │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                          │
│  [Regenerate]                          [Continue]       │
└─────────────────────────────────────────────────────────┘

Mobile (stacked, AI first):
┌─────────────────────────────┐
│ ✨ AI Generated             │
│ [Message content]           │
│ [✓ Selected]                │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 📄 Template                 │
│ [Message content]           │
│ [Click to select]           │
└─────────────────────────────┘
[Regenerate]      [Continue]
```

---

## Analytics & Tracking (PostHog)

### Events to Track

1. **`ai_generation_initiated`**
   - When: User clicks "Enhance with AI"
   - Properties: `contactId`, `userId`, `planType`, `remainingGenerations`

2. **`ai_generation_completed`**
   - When: AI generation succeeds or fails
   - Properties: `contactId`, `userId`, `success`, `errorType`, `responseTimeMs`, `tokensUsed`

3. **`ai_generation_regenerated`**
   - When: User clicks "Regenerate"
   - Properties: `contactId`, `userId`, `attemptNumber`

4. **`ai_message_selected`**
   - When: User selects AI message in comparison view
   - Properties: `contactId`, `userId`

5. **`template_selected`**
   - When: User selects template message in comparison view
   - Properties: `contactId`, `userId`

6. **`introduction_sent`**
   - When: User submits introduction request
   - Properties: `contactId`, `userId`, `usedAI` (boolean), `messageEdited` (boolean)

7. **`ai_upgrade_prompt_clicked`**
   - When: Free user clicks locked "Enhance with AI" button
   - Properties: `userId`, `planType`

---

## Implementation Checklist

### Backend (✅ Completed)

- [x] Install TanStack AI dependencies (`@tanstack/ai`, `@tanstack/groq-adapter`)
- [x] Create database migration for `ai_generations` table
- [x] Update database schema with `ai_generations` table
- [x] Create AI schemas (Zod validation)
- [x] Create AI service with TanStack AI + Groq
- [x] Create AI validation service
- [x] Create AI rate limiting service
- [x] Create AI tRPC router
- [x] Add environment variables (GROQ_API_KEY, etc.)

### Frontend (🔄 In Progress)

- [ ] Update `useAIGeneration` hook to include:
  - Rate limit checking
  - PostHog event tracking
  - Regeneration support
- [ ] Update `IntroductionRequestModal` component:
  - Add "Enhance with AI" button with Pro badge
  - Add loading state overlay
  - Add comparison view (side-by-side cards)
  - Add card selection logic
  - Add "Continue" button
  - Add "Regenerate" button
  - Add rate limit counter display
  - Add free user redirect to billing
- [ ] Add responsive styling for mobile (stacked cards)
- [ ] Add PostHog tracking calls

### Testing (⏳ Pending)

- [ ] Write unit tests for AI service
- [ ] Write unit tests for validation service
- [ ] Write unit tests for rate limiting service
- [ ] Write integration tests for tRPC endpoints
- [ ] Test with real Groq API
- [ ] Test rate limiting behavior
- [ ] Test error scenarios
- [ ] Test Pro vs Free user flows
- [ ] Test mobile responsive layout

### Documentation (⏳ Pending)

- [ ] Update README with AI feature description
- [ ] Document environment variables
- [ ] Add troubleshooting guide
- [ ] Document rate limits and quotas
- [ ] Add API documentation for AI endpoints

---

## Technical Implementation Details

### useAIGeneration Hook Updates

```typescript
export const useAIGeneration = () => {
  const { data: planDetails } = trpc.billing.getPlanDetails.useQuery()
  const { data: rateLimit } = trpc.ai.checkRateLimit.useQuery()
  const generateMutation = trpc.ai.generateIntroductionMessage.useMutation()
  const posthog = usePostHog()

  const handleEnhanceWithAI = async (contactId: string) => {
    // Track initiation
    posthog.capture('ai_generation_initiated', {
      contactId,
      planType: planDetails?.planType,
      remainingGenerations: rateLimit?.remaining,
    })

    // Check plan
    if (planDetails?.planType !== 'pro') {
      posthog.capture('ai_upgrade_prompt_clicked', {
        planType: planDetails?.planType,
      })
      router.navigate({ to: '/me/billing' })
      return
    }

    // Check rate limit
    if (rateLimit && rateLimit.remaining <= 0) {
      toast.error(
        `Rate limit reached. Try again in ${rateLimit.resetIn} minutes`,
      )
      return
    }

    // Generate
    try {
      const result = await generateMutation.mutateAsync({ contactId })

      posthog.capture('ai_generation_completed', {
        contactId,
        success: true,
        responseTimeMs: result.responseTimeMs,
        tokensUsed: result.tokensUsed,
      })

      return result.message
    } catch (error) {
      posthog.capture('ai_generation_completed', {
        contactId,
        success: false,
        errorType: error.message,
      })

      toast.error('Failed to generate AI message. Please try again.')
      throw error
    }
  }

  return {
    handleEnhanceWithAI,
    isGenerating: generateMutation.isPending,
    rateLimit,
    isPro: planDetails?.planType === 'pro',
  }
}
```

### IntroductionRequestModal State Management

```typescript
const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single')
const [selectedMessage, setSelectedMessage] = useState<'template' | 'ai'>(
  'template',
)
const [aiMessage, setAiMessage] = useState<string | null>(null)
const [isGenerating, setIsGenerating] = useState(false)

// When AI generation completes
const handleAIGenerated = (message: string) => {
  setAiMessage(message)
  setSelectedMessage('ai')
  setViewMode('comparison')
  posthog.capture('ai_generation_completed', { success: true })
}

// When user selects a message
const handleMessageSelect = (type: 'template' | 'ai') => {
  setSelectedMessage(type)
  posthog.capture(type === 'ai' ? 'ai_message_selected' : 'template_selected')
}

// When user clicks Continue
const handleContinue = () => {
  const message = selectedMessage === 'ai' ? aiMessage : defaultMessage
  reset({ message })
  setViewMode('single')
}

// When user regenerates
const handleRegenerate = async () => {
  const newMessage = await handleEnhanceWithAI(contact.id)
  if (newMessage) {
    setAiMessage(newMessage)
    setSelectedMessage('ai')
    posthog.capture('ai_generation_regenerated')
  }
}
```

---

## Environment Variables

```bash
# AI Configuration (Groq)
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.7
AI_RATE_LIMIT_PER_HOUR=10
```

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Adoption Rate**: % of Pro users who use AI generation
2. **Success Rate**: % of AI generations that complete successfully
3. **Selection Rate**: % of users who select AI message vs template
4. **Edit Rate**: % of AI messages that get edited before sending
5. **Regeneration Rate**: Average number of regenerations per session
6. **Conversion Rate**: % of free users who upgrade after seeing AI feature

### Target Metrics (First Month)

- Adoption Rate: >30% of Pro users
- Success Rate: >95%
- Selection Rate: >60% choose AI message
- Edit Rate: <40% edit AI messages
- Average Response Time: <3 seconds

---

## Future Enhancements (Post-MVP)

1. **Tone Selection**: Let users choose tone (formal, casual, friendly)
2. **Custom Instructions**: Allow users to provide additional context
3. **Message History**: Save and reuse previous AI messages
4. **A/B Testing**: Test different prompts and models
5. **Streaming**: Show AI message being generated in real-time
6. **Multi-language**: Support for non-English introductions
7. **Smart Suggestions**: AI suggests when to request introductions
8. **Template Learning**: AI learns from user's editing patterns

---

## Risk Mitigation

### Technical Risks

1. **API Downtime**: Groq service unavailable
   - Mitigation: Graceful fallback to template, retry logic
2. **Rate Limit Exhaustion**: Users hit limits frequently
   - Mitigation: Clear UI feedback, consider increasing limits for power users
3. **Poor Message Quality**: AI generates inappropriate content
   - Mitigation: Validation service, user can always edit or use template

### Business Risks

1. **Low Adoption**: Users don't use AI feature
   - Mitigation: Prominent placement, clear value proposition, analytics tracking
2. **High Costs**: Groq usage exceeds free tier
   - Mitigation: Rate limiting, monitor usage, consider paid tier if needed
3. **User Confusion**: Users don't understand AI vs template
   - Mitigation: Clear labeling, comparison view, onboarding tooltips

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

- Deploy to staging environment
- Test with internal team
- Gather feedback on UX
- Fix critical bugs

### Phase 2: Beta Release (Week 2)

- Enable for 10% of Pro users
- Monitor error rates and performance
- Collect user feedback
- Iterate on prompts and UI

### Phase 3: Full Release (Week 3)

- Enable for all Pro users
- Announce feature in product updates
- Monitor adoption metrics
- Plan future enhancements

---

## Support & Maintenance

### Monitoring

- Sentry for error tracking (already integrated)
- PostHog for usage analytics
- Database queries for rate limit analysis
- Groq dashboard for API usage

### Common Issues & Solutions

1. **"Rate limit reached"**: User exhausted 10/hour limit
   - Solution: Wait for hourly reset, consider upgrading limits
2. **"Generation failed"**: API error or validation failure
   - Solution: Retry, check Groq status, review error logs
3. **"Poor message quality"**: AI output not meeting expectations
   - Solution: Use regenerate, adjust prompts, provide feedback

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating AI-powered introduction message generation into IntroHub. The feature is designed to be:

- **User-friendly**: Clear UI, graceful error handling, comparison view
- **Scalable**: Rate limiting, efficient API usage, database tracking
- **Measurable**: Comprehensive analytics, success metrics, monitoring
- **Maintainable**: Clean architecture, well-documented, testable

Next steps: Complete frontend implementation, add analytics tracking, and begin testing phase.
