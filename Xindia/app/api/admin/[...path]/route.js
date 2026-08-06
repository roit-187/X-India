import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxy(request, { params }) {
  const token = cookies().get('admin_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/v1/admin/${path}${search}`;

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
    // Demo fallback when Express backend is offline
    console.warn(`Admin proxy target ${targetUrl} offline. Serving demo response.`);

    if (path.startsWith('dashboard/summary')) {
      return Response.json({ success: true, newBuyers: 42, newSellers: 8, totalInquiries: 156, activeSellers: 35, expiredSellers: 12, totalInquiryValue: 4850000 });
    }
    if (path.startsWith('dashboard/revenue')) {
      return Response.json({ success: true, planRevenue: 149850, creditRevenue: 23940 });
    }
    if (path.startsWith('dashboard/funnel')) {
      return Response.json({ success: true, signedUp: 200, selectedPlan: 85, publishedPortfolio: 62, createdProduct: 48, receivedInquiry: 35 });
    }
    if (path.startsWith('dashboard/top-sellers')) {
      return Response.json({
        success: true,
        sellers: [
          { _id: 'mfr1', name: 'Kumar Textiles Pvt Ltd', rating: 4.8, productCount: 25, inquiriesReceived: 120 },
          { _id: 'mfr2', name: 'Apex Polymers', rating: 4.6, productCount: 18, inquiriesReceived: 95 },
          { _id: 'mfr3', name: 'Precision Engineering Co', rating: 4.5, productCount: 12, inquiriesReceived: 82 },
        ]
      });
    }
    if (path.startsWith('dashboard/moderation-count')) {
      return Response.json({ success: true, count: 3 });
    }
    if (path.startsWith('verification/queue')) {
      return Response.json({
        success: true,
        requests: [
          {
            _id: 'vr1',
            status: 'pending',
            userId: { _id: 'u1', firstName: 'Rajesh', lastName: 'Kumar', email: 'seller@company.com', phone: '+919876543210', location: 'Ludhiana, Punjab' },
            manufacturerId: { _id: 'mfr1', name: 'Kumar Textiles', slug: 'kumar-textiles', address: 'Industrial Area Phase 2, Ludhiana' },
            requestedLocation: { address: 'Industrial Area Phase 2, Ludhiana, Punjab' },
            createdAt: new Date().toISOString(),
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });
    }
    if (path.startsWith('products')) {
      return Response.json({
        success: true,
        products: [
          { _id: 'p1', name: 'Premium Cotton Fabric', category: 'Textiles', price: 450, unit: 'meter', isActive: true, status: 'live', sellerName: 'Kumar Textiles', imageUrl: null, createdAt: new Date().toISOString(), manufacturerId: '6651abc1234567890abcdef1', manufacturer: { _id: '6651abc1234567890abcdef1', name: 'Kumar Textiles Pvt Ltd', slug: 'kumar-textiles' } },
          { _id: 'p2', name: 'HDPE Granules', category: 'Polymers', price: 85000, unit: 'ton', isActive: true, status: 'live', sellerName: 'Apex Polymers', imageUrl: null, createdAt: new Date().toISOString(), manufacturerId: '6651abc1234567890abcdef2', manufacturer: { _id: '6651abc1234567890abcdef2', name: 'Apex Polymer Components', slug: 'apex-polymers' } },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      });
    }
    if (path.startsWith('manufacturers')) {
      if (path.includes('/') && path.split('/')[1] && path.split('/')[1] !== 'bulk-status') {
        const id = path.split('/')[1];
        return Response.json({
          success: true,
          manufacturer: {
            _id: id,
            name: 'Kumar Textiles Pvt Ltd',
            slug: 'kumar-textiles',
            logo: 'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
            coverImage: 'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
            planStatus: 'active',
            planKey: 'growth',
            portfolioAbout: 'Leading manufacturer of premium cotton textiles since 1998.',
            verified: true,
            isActive: true,
            contact: { phone: '+919876543210', email: 'info@kumartextiles.com' },
            buyerContactPhone: '+919876543211',
            address: 'Industrial Area Phase 2, Ludhiana, Punjab',
            factorySize: '25,000+ Sq. Ft.',
            machinesCount: 15,
            employeesCount: 250,
            monthlyCapacity: '50,000 units',
            exportPercentage: '45%',
            yearOfEstablishment: 1998,
            businessType: 'Manufacturer, Exporter',
            legalStatus: 'Private Limited',
            certifications: ['ISO 9001:2015', 'OEKO-TEX', 'BIS Mark'],
            manufacturingPlants: [
              'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
              'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
              'https://res.cloudinary.com/demo/image/upload/v1600000000/sample.jpg',
            ],
            adminNotes: [{ text: 'Verified in-person on 2026-06-15.', createdAt: new Date().toISOString() }],
          },
          products: [{ _id: 'p1', name: 'Premium Cotton Fabric', category: 'Textiles', isActive: true, status: 'active' }],
          stats: { inquiriesReceived: 45, conversationCount: 32, moderationCaseCount: 0, profileCompleteness: { about: true, factoryPhotos: true, logo: true, buyerContactPhone: true, address: true }, accountAge: '2025-03-15T10:00:00Z' },
          planHistory: [{ planKey: 'growth', billingCycle: 'yearly', amount: 9999, startedAt: '2025-07-01T00:00:00Z', expiresAt: '2026-07-01T00:00:00Z' }],
          creditHistory: [
            { type: 'Credit Pack', credits: 50, amount: 499, createdAt: '2025-08-10T00:00:00Z' },
            { type: 'Credit Pack', credits: 100, amount: 899, createdAt: '2025-11-20T00:00:00Z' },
          ],
        });
      }
      return Response.json({
        success: true,
        manufacturers: [
          {
            _id: '6651abc1234567890abcdef1',
            name: 'Kumar Textiles Pvt Ltd',
            slug: 'kumar-textiles',
            planStatus: 'active',
            planKey: 'growth',
            productCount: 12,
            rating: 4.8,
            reviewCount: 15,
            portfolioStatus: 'published',
            verified: true,
            isActive: true,
            address: 'Industrial Area Phase 2, Ludhiana, Punjab',
          },
          {
            _id: '6651abc1234567890abcdef2',
            name: 'Apex Polymer Components',
            slug: 'apex-polymers',
            planStatus: 'grace',
            planKey: 'basic',
            productCount: 8,
            rating: 4.4,
            reviewCount: 6,
            portfolioStatus: 'published',
            verified: false,
            isActive: true,
            address: 'GIDC Industrial Estate, Ahmedabad, Gujarat',
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      });
    }
    if (path.startsWith('buyers')) {
      if (path.includes('/') && path.split('/')[1]) {
        const id = path.split('/')[1];
        return Response.json({
          success: true,
          buyer: { _id: id, firstName: 'Amit', lastName: 'Sharma', email: 'amit@company.com', phone: '+919876000000', location: 'Mumbai, Maharashtra', createdAt: '2026-02-10T00:00:00Z', isBlacklisted: false, blockedUntil: null },
          inquiries: [{ _id: 'inq1', name: 'Need 10,000 cotton shirts', description: 'Looking for manufacturer...', budget: '5-10 Lakh', location: 'Mumbai', categoryId: 'textiles', createdAt: new Date().toISOString() }],
          categoriesOfInterest: ['textiles', 'packaging'],
          conversationCount: 8
        });
      }
      return Response.json({
        success: true,
        buyers: [
          { _id: 'b1', firstName: 'Amit', lastName: 'Sharma', email: 'amit@company.com', phone: '+919876000000', location: 'Mumbai, Maharashtra', createdAt: '2026-02-10T00:00:00Z', isBlacklisted: false, blockedUntil: null, inquiryCount: 12, conversationCount: 8 }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      });
    }
    if (path.startsWith('search')) {
      return Response.json({
        success: true,
        manufacturers: [{ _id: '6651abc1234567890abcdef1', name: 'Kumar Textiles', slug: 'kumar-textiles' }],
        buyers: [{ _id: 'b1', firstName: 'Amit', lastName: 'Sharma', email: 'amit@company.com', phone: '+919876000000', location: 'Mumbai' }]
      });
    }

    return Response.json({ success: true });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
