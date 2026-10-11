import { publicActions, mentorActions, organizerActions, mentorFromToken, HttpError } from '../lib/actions.js';

function adminOk(pw) {
  const expected = process.env.ADMIN_PASSWORD || (process.env.DATABASE_URL ? null : 'admin');
  return !!expected && pw === expected;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { action, args = {} } = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) || {};
  try {
    let out;
    if (Object.hasOwn(publicActions, action)) {
      out = await publicActions[action](args);
    } else if (action?.startsWith('o.')) {
      if (!adminOk(req.headers['x-admin'])) throw new HttpError(401, 'Wrong organizer password');
      const fn = organizerActions[action.slice(2)];
      if (!fn || !Object.hasOwn(organizerActions, action.slice(2))) throw new HttpError(404, 'Unknown action');
      out = await fn(args);
    } else if (Object.hasOwn(mentorActions, action)) {
      const me = await mentorFromToken(req.headers['x-token']);
      out = await mentorActions[action](args, me);
    } else {
      throw new HttpError(404, 'Unknown action');
    }
    res.status(200).json(out ?? {});
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    res.status(e.status || 500).json({ error: e instanceof HttpError ? e.message : 'Something went wrong. Try again.' });
  }
}
