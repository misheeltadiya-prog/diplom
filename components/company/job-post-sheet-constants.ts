import type { JobForm } from "@/components/index-landing/jobs-types";

export const emptyJobForm: JobForm = {
  title: "",
  companyName: "",
  location: "",
  employmentType: "Бүтэн цаг",
  salary: "",
  description: "",
};

export const JOB_POST_SECTION_UI = [
  { short: "Хийж гүйцэтгэх үүрэг", hint: "Өдөр тутмын үндсэн даалгавар, үр дүн." },
  { short: "Тавигдах шаардлага", hint: "Боловсрол, туршлага, хувийн зөвлөмж." },
  { short: "Нэмэлт мэдээлэл", hint: "Ажлын цаг, байршил, багийн бүтэц гэх мэт." },
  { short: "Шаардлагатай ур чадвар", hint: "Хэл, хэрэгсэл, техникийн чадвар." },
  { short: "Хангамж, урамшуулал", hint: "Даатгал, сургалт, урамшуулал." },
  { short: "Холбоо барих", hint: "И-мэйл, утас, хүлээгдэж буй хариуны хугацаа." },
] as const;

export const JOB_POST_TIPS: { mark: string; title: string; desc: string }[] = [
  { mark: "T", title: "Тод гарчиг", desc: "Ажлын нэр, түвшинг нэг мөрт ойлгомжтой бичнэ үү." },
  { mark: "₮", title: "Цалин & төрөл", desc: "Цалин болон ажлын төрлийг нээлттэй заана." },
  { mark: "✓", title: "Тодорхой шаардлага", desc: "Юу хийлгэх, ямар ур чадвар хэрэгтэйг тусад нь." },
  { mark: "◎", title: "Байршил", desc: "Оффис, гибрид эсвэл Remote-ийг тодорхойлно уу." },
];
