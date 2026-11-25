# Terra Calma — העלאה לאוויר

האתר סטטי (index.html + assets), ומחולל הדמיות ה-AI רץ כפונקציית שרת קטנה ב-Netlify.

1. מעלים את התיקייה `terra-calma-site` ל-GitHub (או משתמשים ב-Netlify CLI: `npx netlify deploy --prod`).
   שימו לב: גרירה ל-Netlify Drop מעלה רק את האתר, בלי פונקציית ה-AI.
2. ב-Netlify: Site configuration → Environment variables, מוסיפים:
   - `GEMINI_API_KEY` — מפתח מ-Google AI Studio (חובה).
   - `GEMINI_IMAGE_MODEL` — אופציונלי. ברירת המחדל: `gemini-3.1-flash-lite-image`.
   - `ALLOWED_ORIGIN` — אופציונלי, למשל `https://terracalma.co.il`, כדי שרק האתר שלכם יוכל להשתמש בפונקציה.
3. אחרי פריסה מחדש, הכתובת `/api/concept` תענה, והכפתור "צרו הדמיה" יעבוד.

כל הדמיה עולה כסף לפי התמחור של Google ל-Gemini. בפונקציה יש מגבלה של 8 הדמיות לשעה לכל כתובת IP.
