# AIAssistant Upgrade Plan

## Changes needed:
1. **Left Sidebar (320px fixed)**
   - Conversation history list
   - "New Chat" button at top
   - Each conversation shows preview and date
   - Click to load conversation
   - Delete conversation option
   - Teal scrollbar, glass-card styling

2. **Streaming Responses**
   - Modify askMedicalQuestion to support streaming
   - Use fetch with ReadableStream
   - Show typing indicator with character-by-character appearance
   - Maintain message chunk state

3. **Markdown Rendering**
   - Replace manual line parsing with react-markdown
   - Add remark-gfm for GitHub-flavored markdown
   - Custom components for code blocks, tables, lists
   - Syntax highlighting (optional)

4. **Message Actions**
   - Copy button (copies message to clipboard)
   - Speak button (TTS for message)
   - Translate button (translates message)
   - Show on hover/focus for each assistant message

5. **Enhanced Quota Indicator**
   - Progress bar showing daily usage
   - Circle or pill with numeric count
   - Color-coded (green > 1000, amber > 500, red < 100)
   - Shows model name and region

6. **Quick Actions Enhancement**
   - Larger, more prominent chips
   - Show quick actions after first message
   - Context-aware suggestions

7. **Font Sizes**
   - Assistant message body: text-base (16px)
   - User message: text-sm (15px)
   - Quick action chips: text-sm
   - Header: text-xl
   - Sidebar items: text-sm

## Implementation Steps:
1. Create ChatHistorySidebar component
2. Add streaming utility function
3. Install react-markdown, remark-gfm
4. Create MessageActions component
5. Create QuotaIndicator component
6. Update AIAssistant state to handle streaming chunks
7. Replace manual markdown parsing with Markdown component
8. Wire up all features
9. Test build
