# AI Advisor Setup

The site now includes a first-stage AI admissions advisor UI and a serverless API handler.

## Files

- `index.html`: AI advisor form and result panel.
- `app.js`: collects the current IB profile and posts it to the AI advisor endpoint.
- `api/advisor.js`: serverless backend that calls the OpenAI Responses API.

## Important

Do not put an AI API key in frontend JavaScript. GitHub Pages is static and cannot keep secrets.

To make the AI button work in production, deploy the repository to a serverless host such as Vercel and set:

```text
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
```

## Vercel deployment

The current project includes `vercel.json` and `api/advisor.js`, so it can be deployed as a Vercel site with a serverless API.

Using Vercel CLI:

```powershell
pnpm dlx vercel --prod --yes --token YOUR_VERCEL_TOKEN -e OPENAI_API_KEY=YOUR_OPENAI_API_KEY -e OPENAI_MODEL=gpt-4.1-mini
```

Use the Vercel URL as the live AI-enabled site. GitHub Pages can still host the static backup, but it cannot execute `/api/advisor`.

The frontend calls:

```text
/api/advisor
```

If the backend is hosted on another domain, set this before `app.js` loads:

```html
<script>
  window.AI_ADVISOR_ENDPOINT = "https://your-backend.example.com/api/advisor";
</script>
```

## Product stance

The advisor is intentionally conservative:

- It does not guarantee admission.
- It avoids inventing exact university requirements.
- It tells users to verify official university pages.
- It focuses on Reach / Target / Safety planning, score improvement, and application preparation.
