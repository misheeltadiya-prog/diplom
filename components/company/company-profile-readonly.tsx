import type { CompanyBase } from "@/components/index-landing/companies-directory";
import landingStyles from "@/components/index-landing/index-landing.module.css";

function websiteHref(company: CompanyBase) {
  const raw = company.websiteRaw?.trim();
  if (raw) {
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }
  if (company.domain?.trim() && company.domain !== "example.com") {
    return `https://${company.domain}`;
  }
  return "";
}

type CompanyProfileReadonlyProps = {
  company: CompanyBase;
};

export function CompanyProfileReadonly({ company }: CompanyProfileReadonlyProps) {
  const href = websiteHref(company);

  return (
    <div className={landingStyles.companyModalProfileFields}>
      <dl className={landingStyles.companyModalProfileGrid}>
        <div className={landingStyles.companyModalProfileRow}>
          <dt>Компанийн нэр</dt>
          <dd>{company.name}</dd>
        </div>
        <div className={landingStyles.companyModalProfileRow}>
          <dt>Салбар</dt>
          <dd>{company.industry?.trim() || "—"}</dd>
        </div>
        <div className={landingStyles.companyModalProfileRow}>
          <dt>Байршил (хот)</dt>
          <dd>{company.city?.trim() || "—"}</dd>
        </div>
        <div className={landingStyles.companyModalProfileRow}>
          <dt>Вэбсайт</dt>
          <dd>
            {href ? (
              <a href={href} rel="noopener noreferrer" target="_blank">
                {company.websiteRaw?.trim() || href}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className={`${landingStyles.companyModalProfileRow} ${landingStyles.companyModalProfileRowFull}`}>
          <dt>Танилцуулга</dt>
          <dd className={landingStyles.companyModalProfileDescription}>
            {company.description?.trim() || "Танилцуулга оруулаагүй байна."}
          </dd>
        </div>
      </dl>
    </div>
  );
}
