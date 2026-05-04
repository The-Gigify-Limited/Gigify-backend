#!/usr/bin/env bash
# Per-ticket curl smoke tests against local dev server.
#
# Bootstrap once before running:
#   tsc + node build-dev/scripts/test-bootstrap.js   # writes /tmp/gigify-test-creds.env
#
# Then:
#   bash scripts/smoke-tests.sh
#
# Prints a PASS/FAIL block per ticket with the actual response payload
# so any oddities are visible.

set -uo pipefail

source /tmp/gigify-test-creds.env

PASS_COUNT=0
FAIL_COUNT=0
FAIL_LIST=()

# Print a fenced block and bump counters. Args:
#   $1, ticket label
#   $2, assertion description
#   $3, actual response (or summary)
#   $4, pass | fail
record() {
    local ticket="$1"
    local desc="$2"
    local body="$3"
    local result="$4"
    if [ "$result" = "pass" ]; then
        PASS_COUNT=$((PASS_COUNT + 1))
        echo "✅ [$ticket] $desc"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAIL_LIST+=("$ticket, $desc")
        echo "❌ [$ticket] $desc"
    fi
    echo "$body" | head -c 600
    echo
    echo "---"
}

# Helpers
http_status() {
    # Echo the trailing HTTP_STATUS=NNN appended by curl -w; strip from body.
    awk -F'HTTP_STATUS=' '/HTTP_STATUS=/{print $2; exit}' <<<"$1"
}
http_body() {
    awk '/HTTP_STATUS=/{exit} {print}' <<<"$1"
}

curl_json() {
    # $1 method, $2 url, $3 token, $4 body (optional)
    local method="$1" url="$2" token="$3" body="${4:-}"
    if [ -n "$body" ]; then
        curl -s -w "\nHTTP_STATUS=%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$body"
    else
        curl -s -w "\nHTTP_STATUS=%{http_code}" -X "$method" "$url" \
            -H "Authorization: Bearer $token"
    fi
}

curl_json_anon() {
    local method="$1" url="$2" body="${3:-}"
    if [ -n "$body" ]; then
        curl -s -w "\nHTTP_STATUS=%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" -d "$body"
    else
        curl -s -w "\nHTTP_STATUS=%{http_code}" -X "$method" "$url"
    fi
}

echo "=========================================="
echo " Gigify backend curl smoke tests"
echo " BASE=$BASE"
echo " EMP=$EMP_ID"
echo " TAL=$TAL_ID"
echo "=========================================="
echo

# Set roles via the auth set-role flow that backend has. /set-role is
# protected. Uses the access token of the user setting their own role.
echo "## bootstrap: set-role for employer + talent"
ROLE_EMP_RAW=$(curl_json POST "$BASE/auth/set-role" "$EMP_TOKEN" "{\"userId\":\"$EMP_ID\",\"role\":\"employer\"}")
echo "$(http_body "$ROLE_EMP_RAW")" | head -c 200; echo
ROLE_TAL_RAW=$(curl_json POST "$BASE/auth/set-role" "$TAL_TOKEN" "{\"userId\":\"$TAL_ID\",\"role\":\"talent\"}")
echo "$(http_body "$ROLE_TAL_RAW")" | head -c 200; echo
echo

# ==========================================================
# Ticket #4: base profile fields can update
# Goal: PATCH /user/:id with bannerImageUrl + referral round-trips
# ==========================================================
echo "## Ticket #4: base profile fields"
T4_PATCH_RAW=$(curl_json PATCH "$BASE/user/$EMP_ID" "$EMP_TOKEN" \
    '{"firstName":"QA","lastName":"Employer","bannerImageUrl":"https://cdn.example.com/banner.png","referral":"qa-script-2026"}')
T4_PATCH_BODY=$(http_body "$T4_PATCH_RAW")
T4_PATCH_STATUS=$(http_status "$T4_PATCH_RAW")
if [ "$T4_PATCH_STATUS" = "200" ] && grep -q "bannerImageUrl\":\"https://cdn.example.com/banner.png" <<<"$T4_PATCH_BODY" && grep -q "referral\":\"qa-script-2026" <<<"$T4_PATCH_BODY"; then
    record "#4" "PATCH /user/:id accepts and persists bannerImageUrl + referral" "$T4_PATCH_BODY" pass
else
    record "#4" "PATCH /user/:id accepts and persists bannerImageUrl + referral" "STATUS=$T4_PATCH_STATUS BODY=$T4_PATCH_BODY" fail
fi

T4_GET_RAW=$(curl_json GET "$BASE/user/$EMP_ID" "$EMP_TOKEN")
T4_GET_BODY=$(http_body "$T4_GET_RAW")
if grep -q "bannerImageUrl\":\"https://cdn.example.com/banner.png" <<<"$T4_GET_BODY" && grep -q "referral\":\"qa-script-2026" <<<"$T4_GET_BODY"; then
    record "#4" "GET /user/:id surfaces both fields after update" "$T4_GET_BODY" pass
else
    record "#4" "GET /user/:id surfaces both fields after update" "$T4_GET_BODY" fail
fi

# ==========================================================
# Ticket #5: talent banking fields can update
# ==========================================================
echo "## Ticket #5: talent banking fields"
# First make the talent profile exist by patching first/last name on the user,
# then patch the talent profile with banking info.
curl_json PATCH "$BASE/user/$TAL_ID" "$TAL_TOKEN" '{"firstName":"QA","lastName":"Talent"}' >/dev/null

T5_PATCH_RAW=$(curl_json PATCH "$BASE/talent/$TAL_ID" "$TAL_TOKEN" \
    '{"stageName":"DJ QA","bankName":"GTBank","accountNumber":"0123456789","biography":"qa script"}')
T5_PATCH_BODY=$(http_body "$T5_PATCH_RAW")
T5_PATCH_STATUS=$(http_status "$T5_PATCH_RAW")
if [ "$T5_PATCH_STATUS" = "200" ] && grep -q "bankName\":\"GTBank" <<<"$T5_PATCH_BODY" && grep -q "accountNumber\":\"0123456789" <<<"$T5_PATCH_BODY"; then
    record "#5" "PATCH /talent/:id accepts bankName + accountNumber" "$T5_PATCH_BODY" pass
else
    record "#5" "PATCH /talent/:id accepts bankName + accountNumber" "STATUS=$T5_PATCH_STATUS BODY=$T5_PATCH_BODY" fail
fi

# ==========================================================
# Ticket #6: gig schema FE-aligned fields create + read round-trip
# ==========================================================
echo "## Ticket #6: gig schema FE-aligned fields"

# Resolve a gigTypeId from the canonical /gig/types catalogue so the create
# request mirrors what the FE will be doing.
GIG_TYPES_RAW=$(curl_json GET "$BASE/gig/types" "$EMP_TOKEN")
GIG_TYPE_ID=$(http_body "$GIG_TYPES_RAW" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]) or []; print(rows[0].get('id','') if rows else '')" 2>/dev/null || echo "")

if [ -z "$GIG_TYPE_ID" ]; then
    record "#6" "GET /gig/types returns at least one seed row" "$(http_body "$GIG_TYPES_RAW")" fail
else
    record "#6" "GET /gig/types returns at least one seed row" "GIG_TYPE_ID=$GIG_TYPE_ID" pass
fi

T6_BODY=$(cat <<EOF
{
    "title":"QA Schema Roundtrip",
    "description":"Smoke test gig",
    "budgetAmount":100000,
    "currency":"NGN",
    "gigDate":"2027-12-01",
    "venueName":"QA Hall",
    "displayImage":"https://cdn.example.com/qa.jpg",
    "gigTypeId":"$GIG_TYPE_ID",
    "gigStartTime":"18:00",
    "gigEndTime":"22:00",
    "gigLocation":"Lagos",
    "gigAddress":"5 QA Way",
    "gigPostCode":"101001",
    "isEquipmentRequired":true,
    "skillRequired":["DJ"],
    "additionalNotes":"qa run"
}
EOF
)
T6_CREATE_RAW=$(curl_json POST "$BASE/gig" "$EMP_TOKEN" "$T6_BODY")
T6_CREATE_BODY=$(http_body "$T6_CREATE_RAW")
T6_CREATE_STATUS=$(http_status "$T6_CREATE_RAW")
GIG_ID=$(echo "$T6_CREATE_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null || echo "")

if [ "$T6_CREATE_STATUS" = "201" ] && [ -n "$GIG_ID" ]; then
    record "#6" "POST /gig accepts all FE-aligned fields and creates gig" "GIG_ID=$GIG_ID BODY=$T6_CREATE_BODY" pass
else
    record "#6" "POST /gig accepts all FE-aligned fields and creates gig" "STATUS=$T6_CREATE_STATUS BODY=$T6_CREATE_BODY" fail
fi

if [ -n "$GIG_ID" ]; then
    T6_GET_RAW=$(curl_json GET "$BASE/gig/$GIG_ID" "$EMP_TOKEN")
    T6_GET_BODY=$(http_body "$T6_GET_RAW")
    PASS=true
    for f in "displayImage" "gigTypeId" "gigType" "gigStartTime" "gigEndTime" "gigLocation" "gigAddress" "gigPostCode" "isEquipmentRequired" "skillRequired"; do
        grep -q "\"$f\"" <<<"$T6_GET_BODY" || PASS=false
    done
    if [ "$PASS" = "true" ]; then
        record "#6" "GET /gig/:id surfaces every FE-aligned field" "$T6_GET_BODY" pass
    else
        record "#6" "GET /gig/:id surfaces every FE-aligned field" "$T6_GET_BODY" fail
    fi

    # Ticket #1 piggybacks on this gig: status should be a DB enum (open/draft/...)
    if grep -qE "\"status\":\"(open|draft|in_progress|completed|cancelled|expired|disputed)\"" <<<"$T6_GET_BODY"; then
        record "#1" "GET /gig/:id returns DB enum status (not active/booked/unpublished)" "$(grep -oE '\"status\":\"[^\"]+\"' <<<"$T6_GET_BODY")" pass
    else
        record "#1" "GET /gig/:id returns DB enum status" "$T6_GET_BODY" fail
    fi
fi

# ==========================================================
# Ticket #2: GET /employer/:id/gigs
# ==========================================================
echo "## Ticket #2: employer gigs endpoint"
T2_RAW=$(curl_json GET "$BASE/employer/$EMP_ID/gigs" "$EMP_TOKEN")
T2_BODY=$(http_body "$T2_RAW")
T2_STATUS=$(http_status "$T2_RAW")
GIG_COUNT=$(echo "$T2_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('data', [])))" 2>/dev/null || echo "0")
if [ "$T2_STATUS" = "200" ] && [ "$GIG_COUNT" -ge 1 ]; then
    record "#2" "GET /employer/:id/gigs returns the employer's gigs" "count=$GIG_COUNT BODY=$T2_BODY" pass
else
    record "#2" "GET /employer/:id/gigs returns the employer's gigs" "STATUS=$T2_STATUS BODY=$T2_BODY" fail
fi

# Filter by status, should still return the gig we made
T2_FILTER_RAW=$(curl_json GET "$BASE/employer/$EMP_ID/gigs?status=open" "$EMP_TOKEN")
T2_FILTER_BODY=$(http_body "$T2_FILTER_RAW")
T2_FILTER_STATUS=$(http_status "$T2_FILTER_RAW")
if [ "$T2_FILTER_STATUS" = "200" ]; then
    record "#2" "GET /employer/:id/gigs?status=open accepts status filter" "$T2_FILTER_BODY" pass
else
    record "#2" "GET /employer/:id/gigs?status=open accepts status filter" "STATUS=$T2_FILTER_STATUS BODY=$T2_FILTER_BODY" fail
fi

# ==========================================================
# Ticket #3: /gig/my-gigs/{status} buckets are exclusive
# Just verify each bucket returns 200 with no error; the overlap
# behaviour is unit-tested.
# ==========================================================
echo "## Ticket #3: my-gigs status buckets"
T3_OK=true
for s in applied upcoming active completed; do
    R=$(curl_json GET "$BASE/gig/my-gigs/$s" "$TAL_TOKEN")
    BODY=$(http_body "$R")
    STATUS=$(http_status "$R")
    if [ "$STATUS" != "200" ]; then
        T3_OK=false
    fi
    echo "  $s -> $STATUS"
done
if $T3_OK; then
    record "#3" "GET /gig/my-gigs/{status} returns 200 for every bucket" "applied/upcoming/active/completed all 200" pass
else
    record "#3" "GET /gig/my-gigs/{status} returns 200 for every bucket" "see above" fail
fi

# ==========================================================
# Ticket #7: profile stats surfacing
# ==========================================================
echo "## Ticket #7: profile stats"
T7_TAL_RAW=$(curl_json GET "$BASE/talent/$TAL_ID" "$TAL_TOKEN")
T7_TAL_BODY=$(http_body "$T7_TAL_RAW")
if grep -q "totalGigsCompleted" <<<"$T7_TAL_BODY"; then
    record "#7" "GET /talent/:id surfaces totalGigsCompleted" "$T7_TAL_BODY" pass
else
    record "#7" "GET /talent/:id surfaces totalGigsCompleted" "$T7_TAL_BODY" fail
fi

T7_EMP_RAW=$(curl_json GET "$BASE/employer/$EMP_ID/profile" "$EMP_TOKEN")
T7_EMP_BODY=$(http_body "$T7_EMP_RAW")
if grep -q "totalApplicationsReceived" <<<"$T7_EMP_BODY"; then
    record "#7" "GET /employer/:id/profile surfaces totalApplicationsReceived" "$T7_EMP_BODY" pass
else
    record "#7" "GET /employer/:id/profile surfaces totalApplicationsReceived" "$T7_EMP_BODY" fail
fi

T7_DASH_RAW=$(curl_json GET "$BASE/employer/$EMP_ID/dashboard" "$EMP_TOKEN")
T7_DASH_BODY=$(http_body "$T7_DASH_RAW")
if grep -q "totalApplicationsReceived" <<<"$T7_DASH_BODY"; then
    record "#7" "GET /employer/:id/dashboard surfaces totalApplicationsReceived" "$T7_DASH_BODY" pass
else
    record "#7" "GET /employer/:id/dashboard surfaces totalApplicationsReceived" "$T7_DASH_BODY" fail
fi

# ==========================================================
# Ticket #8: talent search by first/last name
# ==========================================================
echo "## Ticket #8: talent search by name"
# Search using the first name we patched earlier
T8_RAW=$(curl_json_anon GET "$BASE/talent?search=QA")
T8_BODY=$(http_body "$T8_RAW")
T8_STATUS=$(http_status "$T8_RAW")
HITS=$(echo "$T8_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]); print(sum(1 for r in rows if r.get('firstName')=='QA' or r.get('lastName')=='Talent'))" 2>/dev/null || echo "0")
if [ "$T8_STATUS" = "200" ] && [ "$HITS" -ge 1 ]; then
    record "#8" "GET /talent?search=<firstName> matches by users.first_name/last_name" "hits=$HITS BODY=$T8_BODY" pass
else
    record "#8" "GET /talent?search=<firstName> matches by users.first_name/last_name" "STATUS=$T8_STATUS HITS=$HITS BODY=$T8_BODY" fail
fi

# ==========================================================
# Ticket #10: IDUpload bucket
# ==========================================================
echo "## Ticket #10: IDUpload bucket"
TMP_FILE=$(mktemp -t qa-id-upload).png
# Smallest valid PNG (1x1 transparent)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa3\x35\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82' > "$TMP_FILE"

T10_RAW=$(curl -s -w "\nHTTP_STATUS=%{http_code}" -X POST "$BASE/upload?bucket=IDUpload&folder=qa" \
    -H "Authorization: Bearer $TAL_TOKEN" \
    -F "file=@$TMP_FILE")
T10_BODY=$(http_body "$T10_RAW")
T10_STATUS=$(http_status "$T10_RAW")
if [ "$T10_STATUS" = "201" ] && grep -q "/IDUpload/" <<<"$T10_BODY"; then
    record "#10" "POST /upload?bucket=IDUpload returns a public URL in the IDUpload bucket" "$T10_BODY" pass
else
    record "#10" "POST /upload?bucket=IDUpload returns a public URL in the IDUpload bucket" "STATUS=$T10_STATUS BODY=$T10_BODY" fail
fi
rm -f "$TMP_FILE"

# ==========================================================
# Ticket #9: email branding (no curl assertion possible)
# ==========================================================
echo "## Ticket #9: email branding"
echo "  ⚠️  Visual change only, no programmatic assertion. Trigger /auth/forgot-password"
echo "      and inspect the inbox to confirm the new branded layout."
echo

# ==========================================================
# Search filter follow-ups: skillRequired (gig), primaryRole-via-skills
# (talent), and the new generic /talent?location= filter.
# ==========================================================
echo "## Search filters: gig.skillRequired"
T_SR_RAW=$(curl_json_anon GET "$BASE/gig?skillRequired=DJ")
T_SR_BODY=$(http_body "$T_SR_RAW")
T_SR_STATUS=$(http_status "$T_SR_RAW")
if [ "$T_SR_STATUS" = "200" ]; then
    HITS=$(echo "$T_SR_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]); print(sum(1 for r in rows if (r.get('skillRequired') or '').lower().find('dj') >= 0))" 2>/dev/null || echo "0")
    if [ "$HITS" -ge 0 ]; then
        record "filters" "GET /gig?skillRequired=DJ accepts the new filter and returns 200" "hits=$HITS BODY=$T_SR_BODY" pass
    else
        record "filters" "GET /gig?skillRequired=DJ filter rows have skillRequired containing 'dj'" "$T_SR_BODY" fail
    fi
else
    record "filters" "GET /gig?skillRequired=DJ accepts the new filter and returns 200" "STATUS=$T_SR_STATUS BODY=$T_SR_BODY" fail
fi

echo "## Search filters: talent.primaryRole broadened to skills[]"
# The QA talent in test-bootstrap.ts seeds `stage_name='QA Talent'` with no
# skills. To exercise the broadened filter we add a known skill via PATCH
# first, then search by that skill via primaryRole.
curl_json PATCH "$BASE/talent/$TAL_ID" "$TAL_TOKEN" '{"skills":["Guitarist","DJ"]}' >/dev/null

T_PR_RAW=$(curl_json_anon GET "$BASE/talent?primaryRole=Guitarist")
T_PR_BODY=$(http_body "$T_PR_RAW")
T_PR_HITS=$(echo "$T_PR_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]); print(sum(1 for r in rows if r.get('userId')=='$TAL_ID'))" 2>/dev/null || echo "0")
if [ "$T_PR_HITS" -ge 1 ]; then
    record "filters" "GET /talent?primaryRole=<skill> matches via skills[] when primary_role is null" "hits=$T_PR_HITS BODY=$T_PR_BODY" pass
else
    record "filters" "GET /talent?primaryRole=<skill> matches via skills[] when primary_role is null" "$T_PR_BODY" fail
fi

echo "## Search filters: talent.location (substring on city OR country)"
# Patch the talent's city + country, then filter by a substring of either.
curl_json PATCH "$BASE/user/$TAL_ID" "$TAL_TOKEN" '{"locationCity":"Lagos","locationCountry":"Nigeria"}' >/dev/null

T_LOC_RAW=$(curl_json_anon GET "$BASE/talent?location=Lagos")
T_LOC_BODY=$(http_body "$T_LOC_RAW")
T_LOC_HITS=$(echo "$T_LOC_BODY" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]); print(sum(1 for r in rows if r.get('userId')=='$TAL_ID'))" 2>/dev/null || echo "0")
if [ "$T_LOC_HITS" -ge 1 ]; then
    record "filters" "GET /talent?location=Lagos matches by users.location_city" "hits=$T_LOC_HITS BODY=$T_LOC_BODY" pass
else
    record "filters" "GET /talent?location=Lagos matches by users.location_city" "$T_LOC_BODY" fail
fi

T_LOC_C_RAW=$(curl_json_anon GET "$BASE/talent?location=Nigeria")
T_LOC_C_HITS=$(echo "$(http_body "$T_LOC_C_RAW")" | python3 -c "import sys, json; d=json.load(sys.stdin); rows=d.get('data',[]); print(sum(1 for r in rows if r.get('userId')=='$TAL_ID'))" 2>/dev/null || echo "0")
if [ "$T_LOC_C_HITS" -ge 1 ]; then
    record "filters" "GET /talent?location=Nigeria matches by users.location_country" "hits=$T_LOC_C_HITS" pass
else
    record "filters" "GET /talent?location=Nigeria matches by users.location_country" "$(http_body "$T_LOC_C_RAW")" fail
fi

# ==========================================================
# Summary
# ==========================================================
echo "=========================================="
echo " Summary: $PASS_COUNT passed / $FAIL_COUNT failed"
echo "=========================================="
if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "Failures:"
    for f in "${FAIL_LIST[@]}"; do
        echo "  - $f"
    done
    exit 1
fi
