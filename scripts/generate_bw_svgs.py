#!/usr/bin/env python3
"""Generate updated grayscale SVGs for ERD and Architecture."""

def generate_arch_svg():
    width = 900
    height = 520
    
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#1e293b" />
    </marker>
  </defs>

  <!-- Title -->
  <text x="30" y="30" font-size="14" font-weight="bold" fill="#0f172a">Rankstack System Architecture</text>
  <text x="30" y="48" font-size="10.5" fill="#64748b">Decoupled presentation, REST API service, operational in-memory cache, and persistent document store</text>

  <!-- CLIENT TIER -->
  <g transform="translate(40, 75)">
    <rect width="820" height="60" rx="4" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>
    <rect width="820" height="22" rx="4" fill="#1e293b"/>
    <rect y="18" width="820" height="4" fill="#1e293b"/>
    <text x="12" y="15" font-size="11" font-weight="bold" fill="#ffffff">CLIENT TIER: Next.js 16 Web Application (React 19, TypeScript, Tailwind CSS, TanStack Query)</text>
    <text x="12" y="44" font-size="10" fill="#334155">Contestant Interface | Code Submission Editor | Real-Time Live Leaderboard Polling | Team Management</text>
  </g>

  <!-- HTTPS connector -->
  <path d="M 450 135 L 450 175" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="405" y="145" width="90" height="18" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
  <text x="412" y="158" font-size="9" font-weight="bold" fill="#0f172a">HTTPS / JSON</text>

  <!-- APPLICATION TIER -->
  <g transform="translate(40, 175)">
    <rect width="820" height="150" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="820" height="22" rx="4" fill="#1e293b"/>
    <rect y="18" width="820" height="4" fill="#1e293b"/>
    <text x="12" y="15" font-size="11" font-weight="bold" fill="#ffffff">APPLICATION TIER: FastAPI Server (Python 3.14, Thread Pool Worker Execution)</text>
    
    <g transform="translate(20, 35)">
      <rect width="235" height="95" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <text x="10" y="20" font-size="10.5" font-weight="bold" fill="#0f172a">Auth &amp; Rate Limiting</text>
      <text x="10" y="40" font-size="9.5" fill="#475569">- PBKDF2 Password Hashing</text>
      <text x="10" y="58" font-size="9.5" fill="#475569">- 32-Byte Opaque Bearer Tokens</text>
      <text x="10" y="76" font-size="9.5" fill="#475569">- Fixed-Window Rate Limiter (10/60s)</text>
    </g>

    <g transform="translate(285, 35)">
      <rect width="245" height="95" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <text x="10" y="20" font-size="10.5" font-weight="bold" fill="#0f172a">ACID Transaction Services</text>
      <text x="10" y="40" font-size="9.5" fill="#475569">- create_submission (Atomic)</text>
      <text x="10" y="58" font-size="9.5" fill="#475569">- update_submission_status</text>
      <text x="10" y="76" font-size="9.5" fill="#475569">- PyMongo Client Sessions on rs0</text>
    </g>

    <g transform="translate(560, 35)">
      <rect width="240" height="95" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <text x="10" y="20" font-size="10.5" font-weight="bold" fill="#0f172a">Analytical Aggregations</text>
      <text x="10" y="40" font-size="9.5" fill="#475569">- Contest Leaderboard ($group)</text>
      <text x="10" y="58" font-size="9.5" fill="#475569">- Team Performance ($lookup)</text>
      <text x="10" y="76" font-size="9.5" fill="#475569">- Problem Difficulty Analysis</text>
    </g>
  </g>

  <!-- Connectors from App to Data -->
  <path d="M 230 325 L 230 380" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="170" y="340" width="120" height="18" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
  <text x="176" y="353" font-size="8.5" font-weight="bold" fill="#0f172a">Fast-Path Read / Cache</text>

  <path d="M 640 325 L 640 380" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="580" y="340" width="120" height="18" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
  <text x="586" y="353" font-size="8.5" font-weight="bold" fill="#0f172a">ACID Writes &amp; Pipeline</text>

  <!-- DATA TIER: REDIS -->
  <g transform="translate(40, 380)">
    <rect width="380" height="115" rx="4" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>
    <rect width="380" height="22" rx="4" fill="#334155"/>
    <rect y="18" width="380" height="4" fill="#334155"/>
    <text x="12" y="15" font-size="11" font-weight="bold" fill="#ffffff">REDIS 7.4: Operational In-Memory Cache</text>
    <text x="12" y="44" font-size="9.5" font-weight="bold" fill="#0f172a">leaderboard:&lt;id&gt;</text>
    <text x="150" y="44" font-size="9.5" fill="#475569">- Sorted Set (ZSET) for ranks &lt;1ms</text>
    <text x="12" y="64" font-size="9.5" font-weight="bold" fill="#0f172a">leaderboard_revision</text>
    <text x="150" y="64" font-size="9.5" fill="#475569">- Version marker coordinating deltas</text>
    <text x="12" y="84" font-size="9.5" font-weight="bold" fill="#0f172a">session:&lt;token&gt;</text>
    <text x="150" y="84" font-size="9.5" fill="#475569">- Opaque auth session (TTL: 24h)</text>
    <text x="12" y="104" font-size="9.5" font-weight="bold" fill="#0f172a">rate_limit:&lt;user&gt;</text>
    <text x="150" y="104" font-size="9.5" fill="#475569">- Fixed-window counter (TTL: 60s, max 10)</text>
  </g>

  <!-- DATA TIER: MONGODB -->
  <g transform="translate(460, 380)">
    <rect width="400" height="125" rx="4" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>
    <rect width="400" height="22" rx="4" fill="#334155"/>
    <rect y="18" width="400" height="4" fill="#334155"/>
    <text x="12" y="15" font-size="11" font-weight="bold" fill="#ffffff">MONGODB 7.0: Replica Set rs0 (System of Record)</text>
    <text x="12" y="44" font-size="9.5" font-weight="bold" fill="#0f172a">users, teams</text>
    <text x="135" y="44" font-size="9.5" fill="#475569">- Accounts, credentials, team rosters</text>
    <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#0f172a">contests</text>
    <text x="135" y="62" font-size="9.5" fill="#475569">- Timelines, embedded participant references</text>
    <text x="12" y="80" font-size="9.5" font-weight="bold" fill="#0f172a">problems</text>
    <text x="135" y="80" font-size="9.5" fill="#475569">- $jsonSchema with oneOf (MCQ, Coding, Subj)</text>
    <text x="12" y="98" font-size="9.5" font-weight="bold" fill="#0f172a">submissions</text>
    <text x="135" y="98" font-size="9.5" fill="#475569">- Multi-document ACID records and score deltas</text>
    <text x="12" y="116" font-size="9.5" font-weight="bold" fill="#0f172a">dirty_leaderboards</text>
    <text x="135" y="116" font-size="9.5" fill="#475569">- Monotonic version coordination markers</text>
  </g>
</svg>
"""

def generate_erd_bw_svg():
    width = 1050
    height = 720
    
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background:#ffffff; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <style>
      .entity-title {{ font-size: 12px; font-weight: 700; fill: #ffffff; letter-spacing: 0.5px; }}
      .field-pk {{ font-size: 10.5px; font-weight: 700; fill: #0f172a; }}
      .field-fk {{ font-size: 10.5px; font-weight: 600; fill: #334155; }}
      .field-std {{ font-size: 10.5px; font-weight: 400; fill: #334155; }}
      .field-type {{ font-size: 9.5px; font-weight: 400; fill: #64748b; font-family: monospace; }}
      .rel-label {{ font-size: 9px; fill: #334155; font-weight: 600; }}
    </style>
    <marker id="crow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1 L 10 6 L 0 11 M 10 0 L 10 12" fill="none" stroke="#334155" stroke-width="1.5" />
    </marker>
  </defs>

  <!-- Title Header -->
  <text x="30" y="30" font-size="14" font-weight="bold" fill="#0f172a">Rankstack Entity-Relationship Architecture</text>
  <text x="30" y="46" font-size="10.5" fill="#64748b">Primary collections, coordination collection, constraints, and polymorphic problem subtypes</text>

  <!-- USER -->
  <g transform="translate(30, 65)">
    <rect width="200" height="185" rx="3" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="200" height="24" rx="3" fill="#1e293b"/>
    <rect y="20" width="200" height="4" fill="#1e293b"/>
    <text x="10" y="16" class="entity-title">USER</text>
    
    <text x="10" y="44" class="field-pk">id</text><text x="130" y="44" class="field-type">objectId [PK]</text>
    <text x="10" y="62" class="field-pk">email</text><text x="130" y="62" class="field-type">string [UK]</text>
    <text x="10" y="80" class="field-std">name</text><text x="130" y="80" class="field-type">string</text>
    <text x="10" y="98" class="field-std">passwordHash</text><text x="130" y="98" class="field-type">string</text>
    <text x="10" y="116" class="field-std">role</text><text x="130" y="116" class="field-type">enum(part/adm)</text>
    <text x="10" y="134" class="field-std">totalScore</text><text x="130" y="134" class="field-type">double</text>
    <text x="10" y="152" class="field-fk">teamIds</text><text x="130" y="152" class="field-type">objectId[]</text>
    <text x="10" y="170" class="field-std">createdAt</text><text x="130" y="170" class="field-type">date</text>
  </g>

  <!-- TEAM -->
  <g transform="translate(30, 320)">
    <rect width="200" height="155" rx="3" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="200" height="24" rx="3" fill="#1e293b"/>
    <rect y="20" width="200" height="4" fill="#1e293b"/>
    <text x="10" y="16" class="entity-title">TEAM</text>
    
    <text x="10" y="44" class="field-pk">id</text><text x="130" y="44" class="field-type">objectId [PK]</text>
    <text x="10" y="62" class="field-pk">name</text><text x="130" y="62" class="field-type">string [UK]</text>
    <text x="10" y="80" class="field-fk">ownerId</text><text x="130" y="80" class="field-type">objectId [FK]</text>
    <text x="10" y="98" class="field-fk">memberIds</text><text x="130" y="98" class="field-type">objectId[1..5]</text>
    <text x="10" y="116" class="field-std">totalScore</text><text x="130" y="116" class="field-type">double</text>
    <text x="10" y="134" class="field-std">createdAt</text><text x="130" y="134" class="field-type">date</text>
  </g>

  <!-- CONTEST -->
  <g transform="translate(380, 65)">
    <rect width="230" height="215" rx="3" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="230" height="24" rx="3" fill="#1e293b"/>
    <rect y="20" width="230" height="4" fill="#1e293b"/>
    <text x="10" y="16" class="entity-title">CONTEST</text>
    
    <text x="10" y="44" class="field-pk">id</text><text x="150" y="44" class="field-type">objectId [PK]</text>
    <text x="10" y="62" class="field-std">title</text><text x="150" y="62" class="field-type">string</text>
    <text x="10" y="80" class="field-std">description</text><text x="150" y="80" class="field-type">string</text>
    <text x="10" y="98" class="field-std">startTime</text><text x="150" y="98" class="field-type">date</text>
    <text x="10" y="116" class="field-std">endTime</text><text x="150" y="116" class="field-type">date</text>
    <text x="10" y="134" class="field-std">status</text><text x="150" y="134" class="field-type">enum(up/live/end)</text>
    <text x="10" y="152" class="field-fk">createdBy</text><text x="150" y="152" class="field-type">objectId [FK]</text>
    <text x="10" y="170" class="field-fk">problemIds</text><text x="150" y="170" class="field-type">objectId[]</text>
    <text x="10" y="188" class="field-std">participants</text><text x="150" y="188" class="field-type">subdoc[]</text>
    <text x="10" y="204" class="field-std">createdAt</text><text x="150" y="204" class="field-type">date</text>
  </g>

  <!-- PROBLEM -->
  <g transform="translate(380, 330)">
    <rect width="230" height="195" rx="3" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="230" height="24" rx="3" fill="#1e293b"/>
    <rect y="20" width="230" height="4" fill="#1e293b"/>
    <text x="10" y="16" class="entity-title">PROBLEM</text>
    
    <text x="10" y="44" class="field-pk">id</text><text x="150" y="44" class="field-type">objectId [PK]</text>
    <text x="10" y="62" class="field-fk">contestId</text><text x="150" y="62" class="field-type">objectId [FK]</text>
    <text x="10" y="80" class="field-pk">type (discriminator)</text><text x="150" y="80" class="field-type">enum(mcq/cod/sub)</text>
    <text x="10" y="98" class="field-std">title</text><text x="150" y="98" class="field-type">string</text>
    <text x="10" y="116" class="field-std">description</text><text x="150" y="116" class="field-type">string</text>
    <text x="10" y="134" class="field-std">difficulty</text><text x="150" y="134" class="field-type">enum(ez/med/hrd)</text>
    <text x="10" y="152" class="field-std">points</text><text x="150" y="152" class="field-type">double</text>
    <text x="10" y="170" class="field-std">attemptCount</text><text x="150" y="170" class="field-type">int (atomic)</text>
    <text x="10" y="186" class="field-std">solveCount</text><text x="150" y="186" class="field-type">int (atomic)</text>
  </g>

  <!-- SUBTYPES (Grayscale) -->
  <g transform="translate(310, 560)">
    <rect width="180" height="75" rx="3" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
    <text x="8" y="16" font-size="10" font-weight="bold" fill="#0f172a">MCQ PROBLEM</text>
    <text x="8" y="38" class="field-std">options: string[]</text>
    <text x="8" y="58" class="field-std">correctAnswer: string</text>
  </g>

  <g transform="translate(505, 560)">
    <rect width="180" height="85" rx="3" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
    <text x="8" y="16" font-size="10" font-weight="bold" fill="#0f172a">CODING PROBLEM</text>
    <text x="8" y="36" class="field-std">inputFormat: string</text>
    <text x="8" y="54" class="field-std">constraints: string</text>
    <text x="8" y="72" class="field-std">testCases: json[]</text>
  </g>

  <g transform="translate(700, 560)">
    <rect width="180" height="75" rx="3" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
    <text x="8" y="16" font-size="10" font-weight="bold" fill="#0f172a">SUBJECTIVE PROBLEM</text>
    <text x="8" y="38" class="field-std">wordLimit: int</text>
    <text x="8" y="58" class="field-std">evaluationRubric: string</text>
  </g>

  <!-- SUBMISSION -->
  <g transform="translate(740, 110)">
    <rect width="230" height="215" rx="3" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
    <rect width="230" height="24" rx="3" fill="#1e293b"/>
    <rect y="20" width="230" height="4" fill="#1e293b"/>
    <text x="10" y="16" class="entity-title">SUBMISSION</text>
    
    <text x="10" y="44" class="field-pk">id</text><text x="150" y="44" class="field-type">objectId [PK]</text>
    <text x="10" y="62" class="field-fk">contestId</text><text x="150" y="62" class="field-type">objectId [FK]</text>
    <text x="10" y="80" class="field-fk">problemId</text><text x="150" y="80" class="field-type">objectId [FK]</text>
    <text x="10" y="98" class="field-fk">submittedBy.refId</text><text x="150" y="98" class="field-type">objectId [POLY]</text>
    <text x="10" y="116" class="field-std">submittedBy.refType</text><text x="150" y="116" class="field-type">enum(user/team)</text>
    <text x="10" y="134" class="field-std">answer</text><text x="150" y="134" class="field-type">json / string</text>
    <text x="10" y="152" class="field-std">status</text><text x="150" y="152" class="field-type">enum(pend/corr/inc)</text>
    <text x="10" y="170" class="field-std">score</text><text x="150" y="170" class="field-type">double</text>
    <text x="10" y="188" class="field-std">submittedAt</text><text x="150" y="188" class="field-type">date</text>
  </g>

  <!-- DIRTY_LEADERBOARDS -->
  <g transform="translate(740, 360)">
    <rect width="230" height="110" rx="3" fill="#f8fafc" stroke="#334155" stroke-width="1.2"/>
    <rect width="230" height="24" rx="3" fill="#334155"/>
    <rect y="20" width="230" height="4" fill="#334155"/>
    <text x="10" y="16" class="entity-title">DIRTY_LEADERBOARD</text>
    
    <text x="10" y="44" class="field-pk">_id (contestId)</text><text x="150" y="44" class="field-type">objectId [PK, FK]</text>
    <text x="10" y="62" class="field-std">dirty</text><text x="150" y="62" class="field-type">bool</text>
    <text x="10" y="80" class="field-std">version</text><text x="150" y="80" class="field-type">int [monotone]</text>
    <text x="10" y="98" class="field-std">reconciledVersion</text><text x="150" y="98" class="field-type">int / null</text>
  </g>

  <!-- CONNECTIONS -->
  <path d="M 130 250 L 130 320" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#crow)"/>
  <rect x="135" y="275" width="70" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="140" y="287" class="rel-label">1 owns M</text>

  <path d="M 230 110 L 380 110" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#crow)"/>
  <rect x="275" y="102" width="75" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="280" y="114" class="rel-label">1 creates M</text>

  <path d="M 230 150 L 380 150" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#crow)"/>
  <rect x="275" y="142" width="75" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="280" y="154" class="rel-label">joins M</text>

  <path d="M 495 280 L 495 330" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#crow)"/>
  <rect x="500" y="295" width="80" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="505" y="307" class="rel-label">1 contains M</text>

  <path d="M 610 140 L 740 140" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#crow)"/>
  <rect x="645" y="132" width="75" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="650" y="144" class="rel-label">1 tracks M</text>

  <path d="M 610 370 L 680 370 L 680 260 L 740 260" fill="none" stroke="#334155" stroke-width="1.5" marker-end="url(#crow)"/>
  <rect x="655" y="310" width="80" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="660" y="322" class="rel-label">1 receives M</text>

  <path d="M 610 180 L 680 180 L 680 410 L 740 410" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4 2" marker-end="url(#crow)"/>
  <rect x="650" y="280" width="85" height="16" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
  <text x="655" y="292" class="rel-label">1 coordinates</text>

  <!-- Specialization links -->
  <path d="M 430 525 L 400 560" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3 3"/>
  <path d="M 495 525 L 580 560" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3 3"/>
  <path d="M 560 525 L 740 560" fill="none" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3 3"/>

</svg>
"""

with open("docs/arch.svg", "w", encoding="utf-8") as f:
    f.write(generate_arch_svg())

with open("docs/erd.svg", "w", encoding="utf-8") as f:
    f.write(generate_erd_bw_svg())

print("Regenerated docs/arch.svg and docs/erd.svg successfully")
