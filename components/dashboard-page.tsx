"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import type { EmployeeRecord, JobRecord } from "@/lib/portal-data";
import { LogoutButton } from "@/components/logout-button";

type DashboardPageProps = {
  currentUser: SessionUser;
  employees: EmployeeRecord[];
  jobs: JobRecord[];
};

type ToastState = {
  visible: boolean;
  message: string;
};

const initialEmployeeForm = {
  fullName: "",
  roleTitle: "",
  email: "",
  phone: "",
  skills: "",
  bio: "",
};

const initialJobForm = {
  title: "",
  companyName: "",
  location: "",
  employmentType: "Бүтэн цаг",
  salary: "",
  description: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function DashboardPage({ currentUser, employees, jobs }: DashboardPageProps) {
  const router = useRouter();
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [submittingEmployee, setSubmittingEmployee] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "" });

  useEffect(() => {
    if (!toast.visible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast.visible]);

  function showToast(message: string) {
    setToast({ visible: true, message });
  }

  async function handleEmployeeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingEmployee(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeForm),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажилтан нэмэхэд алдаа гарлаа.");
      }

      setEmployeeForm(initialEmployeeForm);
      showToast("Ажилтан database дээр хадгалагдлаа.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSubmittingEmployee(false);
    }
  }

  async function handleJobSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJob(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobForm),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Ажлын зар нэмэхэд алдаа гарлаа.");
      }

      setJobForm(initialJobForm);
      showToast("Ажлын зар database дээр хадгалагдлаа.");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSubmittingJob(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="dashboard-header">
        <div className="topbar">
          <Link href="/" className="brand">
            C-Work.<span>.</span>
          </Link>
          <div className="top-actions">
            <Link className="button button-secondary" href="/">
              Нүүр
            </Link>
            <LogoutButton redirectTo="/" />
          </div>
        </div>

        <div className="dashboard-intro">
          <div>
            <span className="section-label">Dashboard</span>
            <h1>{currentUser.fullName}, тавтай морил</h1>
            <p>
              Эндээс ажилтан болон ажлын заруудыг нэмж, тэдгээрийг MySQL database дээр
              хадгална.
            </p>
          </div>
          <div className="quick-actions">
            <a className="button button-primary" href="#data-overview">
              MySQL дахь өгөгдөл
            </a>
            <a className="button button-secondary" href="#employee-form">
              Ажилтан нэмэх
            </a>
            <a className="button button-secondary" href="#job-form">
              Ажлын зар нэмэх
            </a>
          </div>
        </div>
      </header>

      <section className="section-panel data-overview" id="data-overview">
        <div className="section-head">
          <div>
            <span className="section-label">MySQL</span>
            <h2>Өгөгдлийн санд хадгалагдсан мэдээлэл</h2>
            <p className="dashboard-hint">
              Нэвтэрсний дараа энд харагдана. Доорх тоо нь <code>employees</code> болон{" "}
              <code>job_posts</code> хүснэгтээс уншсан үр дүн.
            </p>
          </div>
        </div>

        <div className="data-stat-badges" role="status">
          <div className="data-stat-badge">
            <span className="data-stat-value">{employees.length}</span>
            <span className="data-stat-label">ажилтан</span>
          </div>
          <div className="data-stat-badge data-stat-badge-jobs">
            <span className="data-stat-value">{jobs.length}</span>
            <span className="data-stat-label">ажлын зар</span>
          </div>
        </div>

        <div className="split-columns data-split">
          <div className="panel data-panel">
            <h3>Ажилтнууд (employees)</h3>
            {employees.length === 0 ? (
              <div className="empty-state">
                <p>Одоогоор мөр алга. Дараахыг шалгана уу:</p>
                <ul className="empty-hint-list">
                  <li>
                    <code>database/schema.sql</code> MySQL дээр ажиллуулсан уу (жишээ мөр оруулна).
                  </li>
                  <li>Доорхоос шинэ ажилтан нэмэх эсвэл .env-ийн MySQL холболт.</li>
                </ul>
              </div>
            ) : (
              <div className="data-card-list">
                {employees.map((employee) => (
                  <article className="data-employee-card" key={employee.id}>
                    <div className="data-employee-card-top">
                      <div>
                        <strong className="data-employee-name">{employee.fullName}</strong>
                        <div className="data-employee-role">{employee.roleTitle}</div>
                      </div>
                      <time className="data-employee-time" dateTime={employee.createdAt}>
                        {formatDate(employee.createdAt)}
                      </time>
                    </div>
                    <dl className="data-employee-dl">
                      <div>
                        <dt>И-мэйл</dt>
                        <dd>{employee.email}</dd>
                      </div>
                      <div>
                        <dt>Утас</dt>
                        <dd>{employee.phone}</dd>
                      </div>
                      <div>
                        <dt>Чадвар</dt>
                        <dd>{employee.skills}</dd>
                      </div>
                      {employee.createdByName ? (
                        <div>
                          <dt>Бүртгэсэн</dt>
                          <dd>{employee.createdByName}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <p className="data-employee-bio">{employee.bio}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel data-panel">
            <h3>Ажлын зарууд (job_posts)</h3>
            {jobs.length === 0 ? (
              <div className="empty-state">Одоогоор ажлын зар нэмэгдээгүй байна.</div>
            ) : (
              <div className="data-card-list">
                {jobs.map((job) => (
                  <article className="data-job-card" key={job.id}>
                    <div className="data-job-card-top">
                      <strong className="data-job-title">{job.title}</strong>
                      <time className="data-employee-time" dateTime={job.createdAt}>
                        {formatDate(job.createdAt)}
                      </time>
                    </div>
                    <div className="data-job-meta">
                      {job.companyName} · {job.location} · {job.employmentType}
                    </div>
                    <div className="data-job-salary">{job.salary}</div>
                    <p className="data-job-desc">{job.description}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="dashboard-grid">
        <section className="panel stack-gap" id="employee-form">
          <div className="section-head compact">
            <div>
              <span className="section-label">Employee Form</span>
              <h2>Ажилтан нэмэх</h2>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleEmployeeSubmit}>
            <label>
              Овог нэр
              <input
                value={employeeForm.fullName}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, fullName: event.target.value })
                }
                required
              />
            </label>

            <label>
              Албан тушаал
              <input
                value={employeeForm.roleTitle}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, roleTitle: event.target.value })
                }
                required
              />
            </label>

            <label>
              И-мэйл
              <input
                type="email"
                value={employeeForm.email}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, email: event.target.value })
                }
                required
              />
            </label>

            <label>
              Утас
              <input
                value={employeeForm.phone}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, phone: event.target.value })
                }
                required
              />
            </label>

            <label>
              Ур чадварууд
              <input
                value={employeeForm.skills}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, skills: event.target.value })
                }
                placeholder="React, Next.js, MySQL"
                required
              />
            </label>

            <label>
              Товч танилцуулга
              <textarea
                value={employeeForm.bio}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, bio: event.target.value })
                }
                rows={5}
                required
              />
            </label>

            <button className="button button-primary full-width" type="submit" disabled={submittingEmployee}>
              {submittingEmployee ? "Хадгалж байна..." : "Ажилтан хадгалах"}
            </button>
          </form>
        </section>

        <section className="panel stack-gap" id="job-form">
          <div className="section-head compact">
            <div>
              <span className="section-label">Job Form</span>
              <h2>Ажлын зар нэмэх</h2>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleJobSubmit}>
            <label>
              Гарчиг
              <input
                value={jobForm.title}
                onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })}
                required
              />
            </label>

            <label>
              Компани
              <input
                value={jobForm.companyName}
                onChange={(event) =>
                  setJobForm({ ...jobForm, companyName: event.target.value })
                }
                required
              />
            </label>

            <label>
              Байршил
              <input
                value={jobForm.location}
                onChange={(event) =>
                  setJobForm({ ...jobForm, location: event.target.value })
                }
                required
              />
            </label>

            <label>
              Ажлын төрөл
              <select
                value={jobForm.employmentType}
                onChange={(event) =>
                  setJobForm({ ...jobForm, employmentType: event.target.value })
                }
              >
                <option>Бүтэн цаг</option>
                <option>Хагас цаг</option>
                <option>Гэрээт</option>
                <option>Remote</option>
              </select>
            </label>

            <label>
              Цалин
              <input
                value={jobForm.salary}
                onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })}
                placeholder="3,500,000₮"
                required
              />
            </label>

            <label>
              Тайлбар
              <textarea
                value={jobForm.description}
                onChange={(event) =>
                  setJobForm({ ...jobForm, description: event.target.value })
                }
                rows={5}
                required
              />
            </label>

            <button className="button button-primary full-width" type="submit" disabled={submittingJob}>
              {submittingJob ? "Хадгалж байна..." : "Ажлын зар хадгалах"}
            </button>
          </form>
        </section>
      </main>

      <div className={`toast ${toast.visible ? "show" : ""}`}>{toast.message}</div>
    </div>
  );
}
