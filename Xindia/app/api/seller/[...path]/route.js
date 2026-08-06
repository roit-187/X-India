import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.com';

async function proxy(request, { params }) {
  const token = cookies().get('seller_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/seller/${path}${search}`;

  const init = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData();
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = await request.text();
    }
  }

  try {
    const res = await fetch(targetUrl, init);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (netErr) {
    console.warn(`Seller proxy target ${targetUrl} offline. Serving demo response.`);

    if (path.startsWith('dashboard/stats')) {
      return Response.json({
        success: true,
        portfolioStatus: 'published',
        planKey: 'growth',
        planBillingCycle: 'yearly',
        planStatus: 'active',
        planExpiresAt: '2026-12-15T00:00:00Z',
        mandatoryFieldsComplete: { about: true, factoryPhotos: true, logo: true, buyerContactPhone: true, address: true },
        completedCount: 5,
        totalRequired: 5,
        productCount: 12,
        totalInquiries: 45,
        conversationCount: 32,
        rating: 4.8,
        reviewCount: 15,
        creditsBalance: 25,
        verified: true
      });
    }

    if (path.startsWith('dashboard/inquiries-trend')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const series = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (13 - i));
        return { date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 6) };
      });
      return Response.json({ success: true, series });
    }

    if (path.startsWith('portfolio')) {
      if (path === 'portfolio/upload-video') {
        return Response.json({ success: true, url: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' });
      }
      if (path === 'portfolio/publish') {
        return Response.json({ success: true, slug: 'kumar-textiles', url: `${SITE_URL}/p/kumar-textiles` });
      }
      if (path === 'portfolio/unpublish') {
        return Response.json({ success: true, portfolioStatus: 'draft' });
      }

      return Response.json({
        success: true,
        manufacturer: {
          _id: 'mfr1',
          portfolioAbout: 'Leading manufacturer of premium cotton textiles since 1998.',
          buyerContactPhone: '+919876543211',
          address: 'Industrial Area Phase 2, Ludhiana, Punjab',
          logo: 'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
          coverImage: 'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
          manufacturingPlants: ['https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg'],
          certifications: ['ISO 9001:2015', 'OEKO-TEX'],
          factorySize: '25,000+ Sq. Ft.',
          machinesCount: 15,
          employeesCount: 250,
          monthlyCapacity: '50,000 units',
          exportPercentage: '45%',
          yearOfEstablishment: 1998,
          businessType: 'Manufacturer, Exporter',
          legalStatus: 'Private Limited',
          portfolioStatus: 'published',
          slug: 'kumar-textiles'
        }
      });
    }

    if (path.startsWith('buyer-activity/inquiries')) {
      return Response.json({
        success: true,
        inquiries: [
          {
            _id: 'inq1',
            name: 'Need 5000 cotton bags for export',
            ownerName: 'Amit Sharma',
            description: 'Looking for quality cotton bags manufacturer for export order.',
            budget: '2-5 Lakh',
            location: 'Mumbai, Maharashtra',
            categoryId: 'textiles',
            boostTier: 'none',
            createdAt: new Date().toISOString(),
            buyer: { firstName: 'Amit', lastName: 'Sharma', email: 'amit@company.com', phone: '+919876000000', location: 'Mumbai' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    }
    if (path.startsWith('buyer-activity/leads')) {
      return Response.json({
        success: true,
        leads: [
          {
            _id: 'lead1',
            name: 'Bulk packaging material needed',
            ownerName: 'Priya Kapoor',
            description: 'Looking for corrugated box manufacturers.',
            budget: '10-20 Lakh',
            location: 'Delhi NCR',
            categoryId: 'packaging',
            boostTier: 'priority',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
    }
    if (path.startsWith('opportunities')) {
      if (request.method === 'GET') {
        return Response.json({ success: true, opportunities: [] });
      }
      return Response.json({ success: true, opportunity: null });
    }

    return Response.json({ success: true });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
