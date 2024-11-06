export const summaryTemplate = `
Task: As an expert content analyzer, create a comprehensive summary and Q&A set for the following YouTube video transcript.

### Transcript to Analyze:
{text}

Please provide your analysis in the following structured format:

## Summary:
[Create a clear, well-organized summary of the main points and key insights from the video]

## Example Questions and Answers:
1. **Question:** [Specific, detailed question about a key point]
   **Answer:** [Clear, accurate answer based on the transcript]

2. **Question:** [Specific, detailed question about another important aspect]
   **Answer:** [Clear, accurate answer based on the transcript]

3. **Question:** [Specific, detailed question about unique insights]
   **Answer:** [Clear, accurate answer based on the transcript]

Guidelines:
- Focus on factual content and valuable insights
- Make questions specific and detailed
- Format output in clean Markdown
- Maintain professional, objective tone
- Include the most important and interesting information
`;

export const summaryRefineTemplate = `
Task: As an expert content analyzer, refine and expand the existing summary based on new transcript information.

### Existing Summary:
{existing_answer}

### Additional Transcript:
{text}

Please refine and enhance the analysis following this format:

## Updated Summary:
[Integrate new information with existing summary, ensuring a coherent narrative]

## Enhanced Q&A Section:
1. **Question:** [New or refined specific question]
   **Answer:** [Detailed answer incorporating all available information]

2. **Question:** [New or refined specific question]
   **Answer:** [Detailed answer incorporating all available information]

Guidelines:
- Maintain consistency with existing summary
- Add new insights where relevant
- Keep questions specific and detailed
- Preserve Markdown formatting
- Focus on factual accuracy
- If new content doesn't add value, retain original content
`;

// Fallback template for handling safety filter issues
export const safeSummaryTemplate = `
Task: Create an academic summary and educational Q&A for the following video transcript.

### Content to Analyze:
{text}

Please provide:

## Key Points Summary:
[Present main educational points and insights]

## Learning Questions:
1. **Study Question:** [Educational question about main concept]
   **Key Learning:** [Educational answer focusing on facts]

2. **Study Question:** [Educational question about key details]
   **Key Learning:** [Educational answer focusing on facts]

Guidelines:
- Focus on educational value
- Use academic language
- Maintain objective tone
- Format in clear Markdown
- Emphasize factual content
`;

// Export all templates for flexible usage
export const templates = {
  main: summaryTemplate,
  refine: summaryRefineTemplate,
  safe: safeSummaryTemplate
};