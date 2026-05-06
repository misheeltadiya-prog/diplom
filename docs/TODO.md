# C-Work — Дутуу зүйлс ба одоогийн байдал

*Шинэчлэгдсэн: 2026-05*

Төсөлд аль хэдийн суусан зүйлсийг доор тэмдэглэсэн. «Бүгдийг нэг дор хийх» нь бизнесийн том модуль (төлбөр, бүрэн real-time чат) орно — энд зөвхөн **үлдсэн ажлыг** цэгцтэй жагсаана.

---

## Аль хэсэг бэлэн (гол нь)

| Хэсэг | Төлөв |
|--------|--------|
| `users.role` (client / freelancer / company / admin) | MySQL migration + `npm run db:role` |
| Бүртгэл / нэвтрэх, session cookie | API + login/register |
| Rate limit (login, register) | `lib/rate-limit` |
| Нууц үг сэргээх, баталгаажуулалт *route* | `app/api/auth/*`, `app/forgot-password` гэх мэт — **SMTP тохируулахгүй бол и-мэйл илгэхгүй** |
| Ажлын зар `job_posts`, `listJobs` / `createJob` | `JOBS_DATABASE` = `MYSQL_DATABASE` эсвэл хоосон |
| Freelancer `freelancer_profiles`, `/api/freelancer-profile` | `npm run db:freelancer` |
| Жагсаалт `/api/job-seekers` (бүртгэлтэй + seed) | `is_active`, `role = freelancer` |
| Өргөдөл `job_applications`, давхар шалгалт, `notify` | `app/api/jobs/[id]/apply` |
| Hire *placeholder* | `app/api/hire` — бодит төлбөр/гэрээ биш |
| Тест (хязгаарлагдмал) | `vitest` + `tests/*` |
| CI | `.github/workflows/ci.yml` (build + test) |
| SEO суурь | `app/sitemap.ts`, `app/robots.ts`, `lib/site-url.ts`, `layout` openGraph |

---

## Улаан — бодитоор их ажил (нэг удаад бүтээн бичихгүй)

- **Төлбөр, escrow, QPay/Stripe** — одоо байхгүй.
- **Бүтэн hire/гэрээ** — `/api/hire` нь зөвхөн placeholder.
- **WebSocket чат** — хуучин чат нь polling/SSE-ээс хамаарсан; бүрэн real-time биш бол магадгүй.
- **CSRF token** бүх form дээр — нэмэх нь өргөн хүрээтэй.
- **Session rotation** — одоо cookie + DB session; нарийн аюулгүй байдлын шаардлага.

---

## Шар — дунд зэргийн (дараалсан нь зөв)

1. **SMTP** — `.env` дээр `SMTP_*` бөглөж нууц үг сэргээх/и-мэйл баталгаа **бодитоор** ажиллуулах.
2. **Admin** — `app/admin` байгаа ч хэрэглэгч/зар бүрэн удирдлага биш бол нэмэх.
3. **Өргөдлийн ажлын урсгал** — статус UI, илгээгчид и-мэйл (notify + SMTP).
4. **Review** — бодит үнэлгээ хүснэгт + API (одоо ихэнх static/seed).
5. **Тест** — API чухал endpoint-ууд дээр vitest нэмэх.
6. **Хуудас бүрийн `metadata`** — `jobs`, `freelancers` гэх мэтэд `title` / `description` тусдаа.
7. **OG зураг** — `openGraph.images` (статик `public/og.png` гэх мэт).

---

## Ногоон — жижиг polish

- Mobile зарим grid-ийг нарийвчлах
- Хоосон төлөв, skeleton
- `Pagination` server-side (олон мянган мөр)

---

## DB нэг мөрөөр

```bash
npm run db:role        # users.role
npm run db:freelancer  # freelancer_profiles
```

`JOBS_DATABASE`-ийг буруу үлдээхгүй — эсвэл хоосон орхино.

---

## Хуучин TODO файлаас хасагдсан (алдаатай байсан)

- «Role DB-д хадгалагдахгүй» — одоо хадгалагдана (migration + register).
- «Rate limit байхгүй» — байна.
- «Password reset огт байхгүй» — route байгаа; SMTP шаардлагатай.
- «Freelancer profile үүсгэж чадахгүй» — одоо боломжтой.
- «.env.example байхгүй» — байна.
