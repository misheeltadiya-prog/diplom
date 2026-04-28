"use client";

import { useMemo, useState } from "react";
import type { EmployeeRecord, JobRecord } from "@/lib/portal-data";

type PortalBrowserProps = {
  employees: EmployeeRecord[];
  jobs: JobRecord[];
};

type ActiveView = "freelancers" | "jobs" | "companies";

type CompanySummary = {
  name: string;
  jobsCount: number;
  locations: string[];
  jobTypes: string[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function PortalBrowser({ employees, jobs }: PortalBrowserProps) {
  const [activeView, setActiveView] = useState<ActiveView>("freelancers");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("all");

  const employmentTypes = useMemo(() => {
    return [...new Set(jobs.map((job) => job.employmentType))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (selectedType === "all") {
      return jobs;
    }

    return jobs.filter((job) => job.employmentType === selectedType);
  }, [jobs, selectedType]);

  const companies = useMemo<CompanySummary[]>(() => {
    const map = new Map<string, CompanySummary>();

    jobs.forEach((job) => {
      const current = map.get(job.companyName);

      if (current) {
        current.jobsCount += 1;
        if (!current.locations.includes(job.location)) {
          current.locations.push(job.location);
        }
        if (!current.jobTypes.includes(job.employmentType)) {
          current.jobTypes.push(job.employmentType);
        }
        return;
      }

      map.set(job.companyName, {
        name: job.companyName,
        jobsCount: 1,
        locations: [job.location],
        jobTypes: [job.employmentType],
      });
    });

    return [...map.values()].sort((a, b) => b.jobsCount - a.jobsCount);
  }, [jobs]);

  function openFreelancers() {
    setActiveView("freelancers");
    setSortOpen(false);
  }

  function openJobs() {
    setActiveView("jobs");
    setSortOpen(false);
  }

  function openCompanies() {
    setActiveView("companies");
    setSortOpen(false);
  }

  function chooseType(type: string) {
    setSelectedType(type);
    setActiveView("jobs");
    setSortOpen(false);
  }

  return (
    <section className="section-panel browser-panel">
      <div className="section-head browser-head">
        <div>
          <span className="section-label">Browse Portal</span>
          <h2>Freelancer, Job, Sort, Company</h2>
        </div>
        <div className="browser-actions">
          <button
            className={`button browser-button${activeView === "freelancers" ? " browser-button-active" : ""}`}
            type="button"
            onClick={openFreelancers}
          >
            Freelancer
          </button>
          <button
            className={`button browser-button${activeView === "jobs" ? " browser-button-active" : ""}`}
            type="button"
            onClick={openJobs}
          >
            Job
          </button>
          <div className="sort-wrap">
            <button
              className={`button browser-button${sortOpen ? " browser-button-active" : ""}`}
              type="button"
              onClick={() => setSortOpen((current) => !current)}
            >
              Sort
            </button>

            {sortOpen ? (
              <div className="sort-menu">
                <button className="sort-item" type="button" onClick={() => chooseType("all")}>
                  Бүх төрөл
                </button>
                {employmentTypes.map((type) => (
                  <button key={type} className="sort-item" type="button" onClick={() => chooseType(type)}>
                    {type}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            className={`button browser-button${activeView === "companies" ? " browser-button-active" : ""}`}
            type="button"
            onClick={openCompanies}
          >
            Company
          </button>
        </div>
      </div>

      <div className="browser-status">
        {activeView === "freelancers" ? (
          <span>{employees.length} ажилтан гарч байна</span>
        ) : null}
        {activeView === "jobs" ? (
          <span>
            {filteredJobs.length} ажил
            {selectedType !== "all" ? ` • ${selectedType}` : ""}
          </span>
        ) : null}
        {activeView === "companies" ? <span>{companies.length} компани гарч байна</span> : null}
      </div>

      {activeView === "freelancers" ? (
        employees.length === 0 ? (
          <div className="empty-state">Одоогоор ажилтан байхгүй байна.</div>
        ) : (
          <div className="card-grid">
            {employees.map((employee) => (
              <article key={employee.id} className="entity-card">
                <div className="card-meta">
                  <span>{employee.roleTitle}</span>
                  <span>{formatDate(employee.createdAt)}</span>
                </div>
                <h3>{employee.fullName}</h3>
                <p>{employee.bio}</p>
                <div className="tag-row">
                  {employee.skills.split(",").map((skill) => (
                    <span key={`${employee.id}-${skill.trim()}`} className="tag">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
                <div className="detail-list">
                  <span>{employee.email}</span>
                  <span>{employee.phone}</span>
                  <span>Нэмсэн: {employee.createdByName ?? "Систем"}</span>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {activeView === "jobs" ? (
        filteredJobs.length === 0 ? (
          <div className="empty-state">Сонгосон төрөл дээр ажил олдсонгүй.</div>
        ) : (
          <div className="card-grid">
            {filteredJobs.map((job) => (
              <article key={job.id} className="entity-card">
                <div className="card-meta">
                  <span>{job.companyName}</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <div className="tag-row">
                  <span className="tag">{job.employmentType}</span>
                  <span className="tag">{job.location}</span>
                </div>
                <div className="detail-list">
                  <span>{job.salary}</span>
                  <span>Нэмсэн: {job.createdByName ?? "Систем"}</span>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {activeView === "companies" ? (
        companies.length === 0 ? (
          <div className="empty-state">Одоогоор компани бүртгэгдээгүй байна.</div>
        ) : (
          <div className="card-grid">
            {companies.map((company) => (
              <article key={company.name} className="entity-card">
                <div className="card-meta">
                  <span>Company</span>
                  <span>{company.jobsCount} ажлын зар</span>
                </div>
                <h3>{company.name}</h3>
                <div className="tag-row">
                  {company.jobTypes.map((type) => (
                    <span key={`${company.name}-${type}`} className="tag">
                      {type}
                    </span>
                  ))}
                </div>
                <div className="detail-list">
                  <span>Байршил: {company.locations.join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
