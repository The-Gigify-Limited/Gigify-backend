begin;

-- Demo users
insert into public.users (
    id, email, first_name, last_name, username, role, status, is_verified, phone_number,
    location_city, location_country, location_latitude, location_longitude, full_address,
    post_code, profile_image_url, created_at, updated_at
)
values
    ('00000000-0000-0000-0000-000000000001', 'admin.demo@gigify.app', 'Platform', 'Admin', 'gigifyadmin', 'admin', 'active', true, '+440000000001', 'London', 'United Kingdom', 51.5074, -0.1278, '12 Admin Wharf, London', 10001, 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39', now() - interval '180 days', now()),
    ('10000000-0000-0000-0000-000000000001', 'events@eventique.test', 'Sarah', 'Cole', 'eventique', 'employer', 'active', true, '+440200000001', 'London', 'United Kingdom', 51.5074, -0.1278, '21 Camden Square, London', 11001, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', now() - interval '120 days', now()),
    ('10000000-0000-0000-0000-000000000002', 'bookings@pulselive.test', 'Tunde', 'Adebayo', 'pulselive', 'employer', 'active', true, '+234800000002', 'Lagos', 'Nigeria', 6.5244, 3.3792, '14 Admiralty Way, Lagos', 100271, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', now() - interval '110 days', now()),
    ('10000000-0000-0000-0000-000000000003', 'hello@northernnights.test', 'Amaka', 'Okoye', 'northernnights', 'employer', 'active', true, '+234800000003', 'Abuja', 'Nigeria', 9.0765, 7.3986, '8 Wuse 2, Abuja', 900211, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', now() - interval '95 days', now()),
    ('20000000-0000-0000-0000-000000000001', 'dj.maxell@test.com', 'Maxwell', 'Adeyemi', 'djmaxell', 'talent', 'active', true, '+234810000001', 'Lagos', 'Nigeria', 6.4654, 3.4064, '24 Allen Avenue, Ikeja', 100282, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', now() - interval '90 days', now()),
    ('20000000-0000-0000-0000-000000000002', 'ada.sax@test.com', 'Ada', 'Nwosu', 'adasax', 'talent', 'active', true, '+234810000002', 'Lagos', 'Nigeria', 6.5244, 3.3792, '18 Victoria Island, Lagos', 101241, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df', now() - interval '88 days', now()),
    ('20000000-0000-0000-0000-000000000003', 'bayo.drums@test.com', 'Bayo', 'Salami', 'bayodrums', 'talent', 'active', true, '+234810000003', 'Abuja', 'Nigeria', 9.0765, 7.3986, '11 Gwarinpa, Abuja', 900108, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', now() - interval '86 days', now()),
    ('20000000-0000-0000-0000-000000000004', 'maya.strings@test.com', 'Maya', 'Elliot', 'mayastrings', 'talent', 'active', true, '+440700000004', 'Manchester', 'United Kingdom', 53.4808, -2.2426, '6 Northern Quarter, Manchester', 22004, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', now() - interval '84 days', now()),
    ('20000000-0000-0000-0000-000000000005', 'kemi.mc@test.com', 'Kemi', 'Daniels', 'kemimc', 'talent', 'active', true, '+234810000005', 'Lagos', 'Nigeria', 6.4698, 3.5852, '9 Lekki Phase 1, Lagos', 101233, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', now() - interval '80 days', now()),
    ('20000000-0000-0000-0000-000000000006', 'leo.violin@test.com', 'Leo', 'Hart', 'leoviolin', 'talent', 'active', true, '+440700000006', 'Manchester', 'United Kingdom', 53.483959, -2.244644, '31 Deansgate, Manchester', 22005, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', now() - interval '78 days', now())
on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    username = excluded.username,
    role = excluded.role,
    status = excluded.status,
    is_verified = excluded.is_verified,
    phone_number = excluded.phone_number,
    location_city = excluded.location_city,
    location_country = excluded.location_country,
    location_latitude = excluded.location_latitude,
    location_longitude = excluded.location_longitude,
    full_address = excluded.full_address,
    post_code = excluded.post_code,
    profile_image_url = excluded.profile_image_url,
    updated_at = excluded.updated_at;

insert into public.notification_preferences (
    user_id, email_enabled, push_enabled, sms_enabled, marketing_enabled,
    gig_updates, payment_updates, message_updates, security_alerts, updated_at
)
values
    ('00000000-0000-0000-0000-000000000001', true, true, false, false, true, true, true, true, now()),
    ('10000000-0000-0000-0000-000000000001', true, true, false, false, true, true, true, true, now()),
    ('10000000-0000-0000-0000-000000000002', true, true, false, true, true, true, true, true, now()),
    ('10000000-0000-0000-0000-000000000003', true, true, false, false, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000001', true, true, false, true, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000002', true, true, false, true, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000003', true, true, false, false, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000004', true, true, false, false, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000005', true, true, false, true, true, true, true, true, now()),
    ('20000000-0000-0000-0000-000000000006', true, true, false, false, true, true, true, true, now())
on conflict (user_id) do update set
    email_enabled = excluded.email_enabled,
    push_enabled = excluded.push_enabled,
    sms_enabled = excluded.sms_enabled,
    marketing_enabled = excluded.marketing_enabled,
    gig_updates = excluded.gig_updates,
    payment_updates = excluded.payment_updates,
    message_updates = excluded.message_updates,
    security_alerts = excluded.security_alerts,
    updated_at = excluded.updated_at;

-- Catalog
insert into public.services_catalog (id, name, category, icon_url, is_active, created_at)
values
    ('40000000-0000-0000-0000-000000000001', 'DJ', 'Music', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000002', 'Saxophonist', 'Music', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000003', 'Drummer', 'Music', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000004', 'MC / Host', 'Hosting', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000005', 'Violinist', 'Strings', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000006', 'Guitarist', 'Music', null, true, now() - interval '180 days'),
    ('40000000-0000-0000-0000-000000000007', 'Live Band', 'Band', null, true, now() - interval '180 days')
on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    is_active = excluded.is_active;

-- Employer profiles
insert into public.employer_profiles (id, user_id, organization_name, company_website, industry, total_gigs_posted, total_spent, updated_at)
values
    ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Eventique Weddings', 'https://eventique.example', 'Events', 4, 720000, now()),
    ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Pulse Live', 'https://pulselive.example', 'Entertainment', 5, 940000, now()),
    ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Northern Nights', 'https://northernnights.example', 'Corporate Events', 3, 510000, now())
on conflict (id) do update set
    organization_name = excluded.organization_name,
    company_website = excluded.company_website,
    industry = excluded.industry,
    total_gigs_posted = excluded.total_gigs_posted,
    total_spent = excluded.total_spent,
    updated_at = excluded.updated_at;

-- Talent profiles
insert into public.talent_profiles (
    id, user_id, banner_url, biography, date_of_birth, min_rate, max_rate,
    primary_role, rate_currency, skills, stage_name, years_experience, updated_at
)
values
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d', 'High-energy Afrobeat and wedding DJ with a club-ready set list.', '1994-02-10', 120000, 300000, 'DJ', 'NGN', '["afrobeat","wedding","club","afterparty"]'::jsonb, 'DJ Maxell', 8, now()),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', 'Smooth saxophone performer for ceremonies, dinner receptions, and premium lounges.', '1996-09-05', 100000, 240000, 'Saxophonist', 'NGN', '["sax","wedding","jazz","reception"]'::jsonb, 'Ada Sax', 6, now()),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1504805572947-34fad45aed93', 'Percussion specialist for concerts, launches, and high-impact live sets.', '1992-07-16', 90000, 220000, 'Drummer', 'NGN', '["drums","live-band","afrobeat","corporate"]'::jsonb, 'Bayo Drums', 10, now()),
    ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b', 'Modern violinist for rooftop weddings, brunches, and luxury private dinners.', '1995-04-25', 900, 2800, 'Violinist', 'GBP', '["violin","strings","wedding","lounge"]'::jsonb, 'Maya Strings', 7, now()),
    ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91', 'Event host and crowd controller for weddings, galas, and branded experiences.', '1993-12-11', 80000, 180000, 'MC / Host', 'NGN', '["host","mc","wedding","brand-events"]'::jsonb, 'Kemi MC', 9, now()),
    ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3', 'Versatile violinist for ceremonies, welcome cocktails, and string-led ensembles.', '1991-03-20', 1200, 3200, 'Violinist', 'GBP', '["violin","ceremony","strings","luxury"]'::jsonb, 'Leo Violin', 11, now())
on conflict (id) do update set
    banner_url = excluded.banner_url,
    biography = excluded.biography,
    date_of_birth = excluded.date_of_birth,
    min_rate = excluded.min_rate,
    max_rate = excluded.max_rate,
    primary_role = excluded.primary_role,
    rate_currency = excluded.rate_currency,
    skills = excluded.skills,
    stage_name = excluded.stage_name,
    years_experience = excluded.years_experience,
    updated_at = excluded.updated_at;

insert into public.talent_portfolios (id, talent_id, portfolio_url, view_count)
values
    ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'https://portfolio.gigify.app/dj-maxell/afterparty-reel', 124),
    ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'https://portfolio.gigify.app/ada-sax/wedding-highlight', 98),
    ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'https://portfolio.gigify.app/bayo-drums/live-set', 76),
    ('31000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'https://portfolio.gigify.app/maya-strings/rooftop-session', 54),
    ('31000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', 'https://portfolio.gigify.app/leo-violin/ceremony-cut', 61)
on conflict (id) do update set
    portfolio_url = excluded.portfolio_url,
    view_count = excluded.view_count;

insert into public.talent_reviews (id, talent_id, reviewer_id, gig_id, rating, comment, created_at, updated_at)
values
    ('32000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 5, 'Ada kept the room calm and elegant from guest arrival through the first dance.', now() - interval '25 days', now() - interval '25 days'),
    ('32000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', 5, 'Kemi managed the gala room perfectly and handled last-minute script changes well.', now() - interval '20 days', now() - interval '20 days'),
    ('32000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 4, 'Leo brought warmth and control to the opening hour of the rooftop set.', now() - interval '12 days', now() - interval '12 days')
on conflict (id) do update set
    rating = excluded.rating,
    comment = excluded.comment,
    updated_at = excluded.updated_at;

-- Gigs
insert into public.gigs (
    id, employer_id, title, description, budget_amount, currency, gig_date, service_id,
    location_name, location_latitude, location_longitude, is_remote, required_talent_count,
    status, created_at, updated_at
)
values
    ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Luxury Wedding Afterparty DJ', 'Need a premium DJ for a 300-guest wedding afterparty set with Afrobeat and house transitions.', 2200, 'GBP', now() + interval '18 days', '40000000-0000-0000-0000-000000000001', 'Kensington, London, United Kingdom', 51.5007, -0.1608, false, 1, 'open', now() - interval '15 days', now()),
    ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Lagos Beach Wedding Sax Set', 'Searching for a saxophonist to perform during guest seating and the sunset cocktail hour.', 180000, 'NGN', now() + interval '12 days', '40000000-0000-0000-0000-000000000002', 'Landmark Beach, Lagos, Nigeria', 6.4281, 3.4219, false, 1, 'open', now() - interval '14 days', now()),
    ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Abuja Corporate Launch Host', 'Confident MC needed for product launch hosting, sponsor mentions, and room transitions.', 150000, 'NGN', now() + interval '10 days', '40000000-0000-0000-0000-000000000004', 'Transcorp Hilton, Abuja, Nigeria', 9.0579, 7.4951, false, 1, 'open', now() - interval '13 days', now()),
    ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Manchester Rooftop Strings Trio', 'Building a three-player strings lineup for a rooftop dinner ceremony and cocktail segment.', 6500, 'GBP', now() + interval '22 days', '40000000-0000-0000-0000-000000000005', 'Northern Quarter, Manchester, United Kingdom', 53.4831, -2.2367, false, 3, 'open', now() - interval '11 days', now()),
    ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Afrobeat Night Drummer', 'Need a drummer with live-band discipline for an Afrobeat club night and rehearsed transitions.', 180000, 'NGN', now() + interval '7 days', '40000000-0000-0000-0000-000000000003', 'Lekki, Lagos, Nigeria', 6.4474, 3.4720, false, 1, 'open', now() - interval '9 days', now()),
    ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Remote Livestream Guitar Session', 'Remote guitarist needed for a branded product reveal livestream and acoustic interludes.', 95000, 'NGN', now() + interval '5 days', '40000000-0000-0000-0000-000000000006', 'Remote', null, null, true, 1, 'open', now() - interval '8 days', now()),
    ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Luxury Gala Host', 'Experienced host already engaged for a live donor gala with sponsor coordination.', 1400, 'GBP', now() + interval '2 days', '40000000-0000-0000-0000-000000000004', 'Canary Wharf, London, United Kingdom', 51.5054, -0.0235, false, 1, 'in_progress', now() - interval '18 days', now()),
    ('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'Festival Warmup DJ', 'Completed festival warmup set for a 45-minute high-energy arrival window.', 250000, 'NGN', now() - interval '6 days', '40000000-0000-0000-0000-000000000001', 'Tafawa Balewa Square, Lagos, Nigeria', 6.4500, 3.3958, false, 1, 'completed', now() - interval '25 days', now()),
    ('50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Sunday Jazz Violin Set', 'Looking for a violinist for a premium Sunday brunch lounge set.', 1600, 'GBP', now() + interval '14 days', '40000000-0000-0000-0000-000000000005', 'Soho, London, United Kingdom', 51.5138, -0.1365, false, 1, 'open', now() - interval '7 days', now()),
    ('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'Product Reveal Percussion Crew', 'Need two percussionists for a high-tempo product reveal and finale segment.', 300000, 'NGN', now() + interval '16 days', '40000000-0000-0000-0000-000000000003', 'Eko Convention Centre, Lagos, Nigeria', 6.4283, 3.4210, false, 2, 'open', now() - interval '6 days', now()),
    ('50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'Abuja Wedding Band Lead', 'Need a confident band lead to coordinate a compact wedding music crew for the evening.', 220000, 'NGN', now() + interval '19 days', '40000000-0000-0000-0000-000000000007', 'Maitama, Abuja, Nigeria', 9.0820, 7.4919, false, 1, 'open', now() - interval '5 days', now()),
    ('50000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Corporate Afterparty DJ', 'Need a DJ with polished transitions for a late-night corporate afterparty.', 210000, 'NGN', now() + interval '9 days', '40000000-0000-0000-0000-000000000001', 'Victoria Island, Lagos, Nigeria', 6.4285, 3.4217, false, 1, 'open', now() - interval '4 days', now())
on conflict (id) do update set
    employer_id = excluded.employer_id,
    title = excluded.title,
    description = excluded.description,
    budget_amount = excluded.budget_amount,
    currency = excluded.currency,
    gig_date = excluded.gig_date,
    service_id = excluded.service_id,
    location_name = excluded.location_name,
    location_latitude = excluded.location_latitude,
    location_longitude = excluded.location_longitude,
    is_remote = excluded.is_remote,
    required_talent_count = excluded.required_talent_count,
    status = excluded.status,
    updated_at = excluded.updated_at;

insert into public.gig_applications (
    id, gig_id, talent_id, status, cover_message, proposed_rate, employer_notes, applied_at, hired_at, updated_at
)
values
    ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'submitted', 'I can build a luxury afterparty arc and close strong.', 2000, null, now() - interval '4 days', null, now() - interval '4 days'),
    ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'hired', 'I have a clean ceremony and cocktail set ready.', 180000, 'Confirmed for cocktail hour.', now() - interval '5 days', now() - interval '3 days', now() - interval '3 days'),
    ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'reviewing', 'I have hosted launches and sponsor-heavy rooms before.', 140000, null, now() - interval '3 days', null, now() - interval '3 days'),
    ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'shortlisted', 'I can lead one of the three strings positions.', 1700, null, now() - interval '2 days', null, now() - interval '2 days'),
    ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 'hired', 'Happy to take the full run-of-show.', 1350, 'Already approved by client.', now() - interval '10 days', now() - interval '8 days', now() - interval '8 days'),
    ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 'shortlisted', 'My percussion team can handle reveal and finale cues.', 150000, null, now() - interval '2 days', null, now() - interval '2 days'),
    ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'submitted', 'Open to joining one of the percussion positions.', 140000, null, now() - interval '1 day', null, now() - interval '1 day'),
    ('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', 'reviewing', 'I can coordinate the live band and handoffs.', 210000, null, now() - interval '1 day', null, now() - interval '1 day'),
    ('60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', 'hired', 'Available for the opening violin slot.', 1900, 'Direct offer accepted.', now() - interval '6 days', now() - interval '5 days', now() - interval '5 days'),
    ('60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', 'submitted', 'Corporate afterparties are my strongest format.', 210000, null, now() - interval '18 hours', null, now() - interval '18 hours')
on conflict (id) do update set
    status = excluded.status,
    cover_message = excluded.cover_message,
    proposed_rate = excluded.proposed_rate,
    employer_notes = excluded.employer_notes,
    hired_at = excluded.hired_at,
    updated_at = excluded.updated_at;

insert into public.gig_offers (
    id, gig_id, employer_id, talent_id, message, proposed_rate, currency, status, expires_at, responded_at, created_at, updated_at
)
values
    ('61000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'We think your Afrobeat timing fits this room perfectly.', 180000, 'NGN', 'pending', now() + interval '4 days', null, now() - interval '12 hours', now()),
    ('61000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'Interested in your ceremony-to-afterparty crossover style.', 2200, 'GBP', 'pending', now() + interval '3 days', null, now() - interval '10 hours', now()),
    ('61000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'Confirmed for one of the three string positions.', 1900, 'GBP', 'accepted', now() + interval '2 days', now() - interval '5 days', now() - interval '6 days', now()),
    ('61000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 'Would love you to anchor crowd energy before the reveal.', 145000, 'NGN', 'declined', now() + interval '1 day', now() - interval '6 hours', now() - interval '2 days', now()),
    ('61000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Could you step in as the lead coordinator for the band?', 220000, 'NGN', 'pending', now() + interval '5 days', null, now() - interval '8 hours', now())
on conflict (id) do update set
    message = excluded.message,
    proposed_rate = excluded.proposed_rate,
    currency = excluded.currency,
    status = excluded.status,
    expires_at = excluded.expires_at,
    responded_at = excluded.responded_at,
    updated_at = excluded.updated_at;

insert into public.payments (
    id, gig_id, application_id, employer_id, talent_id, amount, currency, platform_fee, provider,
    payment_reference, status, metadata, paid_at, created_at, updated_at
)
values
    ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 180000, 'NGN', 15000, 'manual', 'PAY-GIG-002', 'processing', '{"source":"hireTalent"}'::jsonb, null, now() - interval '3 days', now()),
    ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 1400, 'GBP', 100, 'manual', 'PAY-GIG-007', 'paid', '{"source":"hireTalent"}'::jsonb, now() - interval '1 day', now() - interval '8 days', now()),
    ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 1900, 'GBP', 120, 'manual', 'PAY-OFFER-004', 'pending', '{"source":"gigOfferAccepted"}'::jsonb, null, now() - interval '5 days', now())
on conflict (id) do update set
    amount = excluded.amount,
    currency = excluded.currency,
    platform_fee = excluded.platform_fee,
    provider = excluded.provider,
    payment_reference = excluded.payment_reference,
    status = excluded.status,
    metadata = excluded.metadata,
    paid_at = excluded.paid_at,
    updated_at = excluded.updated_at;

insert into public.payout_requests (id, talent_id, amount, currency, note, status, processed_at, created_at, updated_at)
values
    ('71000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 90000, 'NGN', 'Partial payout before event weekend.', 'requested', null, now() - interval '20 hours', now()),
    ('71000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', 1000, 'GBP', 'Weekly withdrawal.', 'paid', now() - interval '12 hours', now() - interval '2 days', now())
on conflict (id) do update set
    amount = excluded.amount,
    currency = excluded.currency,
    note = excluded.note,
    status = excluded.status,
    processed_at = excluded.processed_at,
    updated_at = excluded.updated_at;

insert into public.saved_gigs (id, user_id, gig_id, created_at)
values
    ('72000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', now() - interval '10 hours'),
    ('72000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000011', now() - interval '8 hours'),
    ('72000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000012', now() - interval '6 hours')
on conflict (id) do update set
    created_at = excluded.created_at;

insert into public.conversations (id, gig_id, employer_id, talent_id, last_message_at, created_at, updated_at)
values
    ('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', now() - interval '2 hours', now() - interval '1 day', now() - interval '2 hours'),
    ('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', now() - interval '5 hours', now() - interval '2 days', now() - interval '5 hours')
on conflict (id) do update set
    last_message_at = excluded.last_message_at,
    updated_at = excluded.updated_at;

insert into public.messages (id, conversation_id, sender_id, body, attachment_url, read_at, created_at)
values
    ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Hi Maxell, can you share a quick club set reference?', null, now() - interval '9 hours', now() - interval '9 hours'),
    ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Absolutely, I will send a 60-second reel in a moment.', null, now() - interval '8 hours', now() - interval '8 hours'),
    ('81000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Perfect. We also sent a formal offer through the app.', null, null, now() - interval '2 hours'),
    ('81000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Leo, are you available to cover both ceremony and cocktail welcome?', null, now() - interval '7 hours', now() - interval '7 hours'),
    ('81000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', 'Yes, and I can bring a second violinist if needed.', null, now() - interval '6 hours', now() - interval '6 hours')
on conflict (id) do update set
    body = excluded.body,
    read_at = excluded.read_at,
    created_at = excluded.created_at;

insert into public.notifications (id, user_id, type, title, message, channel, payload, is_read, read_at, sent_at, created_at)
values
    ('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'application_update', 'New gig offer received', 'You received a direct offer for "Afrobeat Night Drummer".', 'in_app', '{"gigId":"50000000-0000-0000-0000-000000000005","offerId":"61000000-0000-0000-0000-000000000001"}'::jsonb, false, null, now() - interval '12 hours', now() - interval '12 hours'),
    ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'message_received', 'New message', 'Pulse Live sent you a new chat message.', 'in_app', '{"conversationId":"80000000-0000-0000-0000-000000000001"}'::jsonb, false, null, now() - interval '2 hours', now() - interval '2 hours'),
    ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'application_update', 'Application update', 'A talent accepted your direct offer for a previous gig.', 'in_app', '{"gigId":"50000000-0000-0000-0000-000000000004"}'::jsonb, true, now() - interval '1 day', now() - interval '2 days', now() - interval '2 days'),
    ('90000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'payment_update', 'Payment processing', 'Your Lagos Beach Wedding Sax payment is being processed.', 'in_app', '{"paymentId":"70000000-0000-0000-0000-000000000001"}'::jsonb, false, null, now() - interval '3 days', now() - interval '3 days'),
    ('90000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'gig_update', 'Gig starts soon', 'Your Luxury Gala Host booking goes live in 48 hours.', 'in_app', '{"gigId":"50000000-0000-0000-0000-000000000007"}'::jsonb, false, null, now() - interval '6 hours', now() - interval '6 hours')
on conflict (id) do update set
    title = excluded.title,
    message = excluded.message,
    payload = excluded.payload,
    is_read = excluded.is_read,
    read_at = excluded.read_at,
    sent_at = excluded.sent_at,
    created_at = excluded.created_at;

insert into public.activities (id, user_id, event_type, reference_id, metadata, created_at)
values
    ('91000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'gig_posted', '50000000-0000-0000-0000-000000000001', '{"title":"Luxury Wedding Afterparty DJ"}'::jsonb, now() - interval '15 days'),
    ('91000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'gig_started', '50000000-0000-0000-0000-000000000002', '{"paymentId":"70000000-0000-0000-0000-000000000001"}'::jsonb, now() - interval '3 days'),
    ('91000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'gig_started', '50000000-0000-0000-0000-000000000007', '{"paymentId":"70000000-0000-0000-0000-000000000002"}'::jsonb, now() - interval '8 days'),
    ('91000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', 'gig_started', '50000000-0000-0000-0000-000000000004', '{"offerId":"61000000-0000-0000-0000-000000000003"}'::jsonb, now() - interval '5 days'),
    ('91000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'payment_received', '70000000-0000-0000-0000-000000000001', '{"amount":180000,"currency":"NGN"}'::jsonb, now() - interval '3 days')
on conflict (id) do update set
    metadata = excluded.metadata,
    created_at = excluded.created_at;

insert into public.identity_verifications (id, user_id, id_type, media_url, selfie_url, status, notes, reviewed_at, created_at, updated_at)
values
    ('92000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'national_id', 'https://storage.gigify.app/id/maxell-id.jpg', 'https://storage.gigify.app/id/maxell-selfie.mp4', 'pending', 'Queued for review.', null, now() - interval '1 day', now()),
    ('92000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'passport', 'https://storage.gigify.app/id/ada-passport.jpg', 'https://storage.gigify.app/id/ada-selfie.mp4', 'approved', 'Identity confirmed.', now() - interval '15 days', now() - interval '18 days', now()),
    ('92000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'drivers_license', 'https://storage.gigify.app/id/bayo-license.jpg', 'https://storage.gigify.app/id/bayo-selfie.mp4', 'rejected', 'Image was blurry. Resubmission needed.', now() - interval '5 days', now() - interval '6 days', now())
on conflict (id) do update set
    status = excluded.status,
    notes = excluded.notes,
    reviewed_at = excluded.reviewed_at,
    updated_at = excluded.updated_at;

insert into public.reports (id, gig_id, reporter_id, reported_user_id, category, reason, status, resolution_note, reviewed_by, reviewed_at, created_at, updated_at)
values
    ('93000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'professional_conduct', 'Talent arrived late to rehearsal and missed one briefing checkpoint.', 'open', null, null, null, now() - interval '18 hours', now()),
    ('93000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'payment_dispute', 'Issue was resolved after payout timeline clarification.', 'resolved', 'Resolved after confirming payout schedule.', '00000000-0000-0000-0000-000000000001', now() - interval '4 days', now() - interval '7 days', now())
on conflict (id) do update set
    status = excluded.status,
    resolution_note = excluded.resolution_note,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    updated_at = excluded.updated_at;

insert into public.audit_logs (
    id, user_id, action, resource_type, resource_id, changes, result,
    ip_address, user_agent, error_message, created_at
)
values
    ('94000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin_report_reviewed', 'report', '93000000-0000-0000-0000-000000000002', '{"status":"resolved"}'::jsonb, 'success', '127.0.0.1', 'seed-script', null, now() - interval '4 days'),
    ('94000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin_payout_request_reviewed', 'payout_request', '71000000-0000-0000-0000-000000000002', '{"status":"paid"}'::jsonb, 'success', '127.0.0.1', 'seed-script', null, now() - interval '12 hours')
on conflict (id) do update set
    changes = excluded.changes,
    created_at = excluded.created_at;

commit;
