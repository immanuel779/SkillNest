export const config = {
  api: {
    bodyParser: false, // needed to read the raw file upload
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple manual read of the multipart body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  // TEMPORARY: turn the raw body into a data URL so you can test the flow.
  // For a real app, replace this whole block with real storage
  // (Vercel Blob, Supabase Storage, Cloudinary, etc.) and parse the multipart.
  const base64 = buffer.toString('base64');
  const url = `data:image/png;base64,${base64}`;

  return res.status(200).json({ url });
}