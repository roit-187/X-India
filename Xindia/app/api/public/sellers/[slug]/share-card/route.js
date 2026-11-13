/* ImageResponse requires native img elements for its server-side PNG renderer. */
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { getSeller, getSellerProducts, getSellerDestination } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function publicImage(raw) {
  const source = resolveImageUrl(raw);
  if (!source) return null;
  try {
    const url = new URL(source);
    // Only our public media providers are fetched server-side; no arbitrary seller URLs or redirects.
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !['res.cloudinary.com', 'xindia-media-worker.xindia369.workers.dev', 'api.xindia.live'].includes(url.hostname)) return null;
    const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } });
    const type = res.headers.get('content-type')?.split(';')[0];
    if (!res.ok || !['image/png', 'image/jpeg', 'image/webp'].includes(type)) return null;
    const reader = res.body.getReader();
    const chunks = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 4 * 1024 * 1024) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    return `data:${type};base64,${Buffer.concat(chunks).toString('base64')}`;
  } catch (_) { return null; }
}

export async function GET(request, { params }) {
  try {
    const resolved = await getSellerDestination(params.slug);
    if (!resolved) return Response.json({ success: false, message: 'Published portfolio not found.' }, { status: 404 });
    const [seller, catalogue] = await Promise.all([getSeller(params.slug), getSellerProducts(params.slug, { limit: 3 })]);
    if (!seller) return Response.json({ success: false, message: 'Portfolio not found.' }, { status: 404 });
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live').replace(/\/+$/, '');
    const target = `${site}/p/${encodeURIComponent(seller.slug)}?src=qr#products`;
    const photos = (catalogue.products || []).map((p) => p.imageUrl || p.images?.[0]).filter(Boolean).slice(0, 3);
    const fingerprint = createHash('sha256').update(JSON.stringify({ design: 2, name: seller.name, logo: seller.logo,
      businessType: seller.businessType, photos, target })).digest('hex');
    const etag = `"${fingerprint}"`;
    const headers = { ETag: etag, 'Cache-Control': 'private, no-cache', 'X-Content-Type-Options': 'nosniff' };
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
    const [logo, images, qr, brandBytes] = await Promise.all([
      publicImage(seller.logo), Promise.all(photos.map(publicImage)),
      QRCode.toDataURL(target, { errorCorrectionLevel: 'H', margin: 4, width: 580, color: { dark: '#081B35', light: '#FFFFFF' } }),
      readFile(path.join(process.cwd(), 'public/logo.png')),
    ]);
    const availablePhotos = images.filter(Boolean);
    // Retry incomplete media on a later share rather than caching that omission indefinitely.
    if ((seller.logo && !logo) || availablePhotos.length !== photos.length) delete headers.ETag;
    const brand = `data:image/png;base64,${brandBytes.toString('base64')}`;
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '65px 72px 48px', backgroundColor: '#FFFFFF', color: '#081B35', position: 'relative', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', width: 400, height: 1700, right: -375, top: -100, borderRadius: 210, backgroundColor: '#FF850A', transform: 'rotate(9deg)' }} />
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 26, minHeight: 140, paddingBottom: 24, borderBottom: '2px solid #102A56', flexShrink: 0 }}>
          {logo ? <img src={logo} width={126} height={126} style={{ objectFit: 'contain', borderRadius: 18 }} alt="" />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 126, height: 126, borderRadius: 22, backgroundColor: '#EEF2F8', fontSize: 66 }}>{(seller.name || '').slice(0, 1)}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
            <div style={{ fontSize: seller.name?.length > 80 ? 28 : seller.name?.length > 50 ? 34 : seller.name?.length > 30 ? 40 : 54, fontWeight: 700, lineHeight: 1.12, overflowWrap: 'anywhere' }}>{seller.name}</div>
            {!!seller.businessType && <div style={{ fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: '#475569' }}>{seller.businessType}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 30, marginBottom: 22, flexShrink: 0 }}>
          <div style={{ fontSize: 94, fontWeight: 700, lineHeight: 1.02 }}>View Our</div>
          <div style={{ fontSize: 102, fontWeight: 700, lineHeight: 1.08 }}>Catalogue</div>
          <div style={{ fontSize: 37, color: '#52525B', marginTop: 22 }}>Scan to explore our</div>
          <div style={{ fontSize: 37, color: '#52525B' }}>complete product range</div>
        </div>
        {availablePhotos.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, marginBottom: 26 }}>
          {availablePhotos.map((src, index) => <img key={index} src={src} width={216} height={170} style={{ objectFit: 'contain', border: '2px solid #E5E7EB', borderRadius: 24, backgroundColor: '#FAFAFA' }} alt="" />)}
        </div>}
        <div style={{ display: 'flex', padding: 4, borderRadius: 32, border: '8px solid #FF850A', marginTop: availablePhotos.length ? 0 : 35, flexShrink: 0 }}>
          <img src={qr} width={availablePhotos.length ? 440 : 500} height={availablePhotos.length ? 440 : 500} alt="Portfolio QR code" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, borderRadius: 44, backgroundColor: '#F1F3F7', padding: '0px 30px', marginTop: 24, height: 100, flexShrink: 0 }}>
          <div style={{ fontSize: 33, fontWeight: 700 }}>Powered by</div>
          <div style={{ width: 2, height: 50, backgroundColor: '#102A56' }} />
          <img src={brand} width={96} height={96} style={{ objectFit: 'contain' }} alt="XINDIA" />
        </div>
        <div style={{ fontSize: 23, textAlign: 'center', color: '#475569', marginTop: 26, flexShrink: 0 }}>Explore products. Connect with this business.</div>
      </div>, { width: 1024, height: 1536, headers },
    );
  } catch (err) {
    console.error('[PORTFOLIO SHARE CARD]', err.message);
    return Response.json({ success: false, message: 'Could not create the catalogue image. Please try again.' }, { status: 503 });
  }
}
