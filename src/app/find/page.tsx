'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

// ─── Quiz data ────────────────────────────────────────────────────────────────

type Step = {
  id: string;
  question: string;
  options: { label: string; icon: string; next?: string; specialties?: string[] }[];
};

const STEPS: Record<string, Step> = {
  start: {
    id: 'start',
    question: 'What brings you in today?',
    options: [
      { label: 'Heart & blood pressure concerns', icon: '❤️', next: 'heart' },
      { label: 'Mental health & emotions', icon: '🧠', next: 'mental' },
      { label: 'Skin, hair or nails', icon: '🩹', next: 'skin' },
      { label: 'Bones, joints or muscles', icon: '🦴', next: 'bones' },
      { label: 'Eyes or vision', icon: '👁️', specialties: ['Ophthalmology'] },
      { label: 'Ear, nose or throat', icon: '👂', specialties: ['Otolaryngology'] },
      { label: 'Digestive issues', icon: '🫁', next: 'digestive' },
      { label: "Women's health", icon: '🌸', next: 'womens' },
      { label: "Children's health", icon: '👶', specialties: ['Pediatrics'] },
      { label: 'Cancer screening or treatment', icon: '🔬', specialties: ['Oncology'] },
      {
        label: 'General checkup',
        icon: '🩺',
        specialties: ['Internal Medicine', 'Family Medicine'],
      },
      { label: 'Something else', icon: '💬', next: 'other' },
    ],
  },
  heart: {
    id: 'heart',
    question: 'Tell me more about your heart concern',
    options: [
      { label: 'Chest pain or irregular heartbeat', icon: '💓', specialties: ['Cardiology'] },
      {
        label: 'High blood pressure',
        icon: '📊',
        specialties: ['Cardiology', 'Internal Medicine'],
      },
      { label: 'Vascular issues (veins/arteries)', icon: '🩸', specialties: ['Vascular Surgery'] },
      { label: 'General heart health', icon: '❤️', specialties: ['Cardiology'] },
    ],
  },
  mental: {
    id: 'mental',
    question: 'What kind of support are you looking for?',
    options: [
      { label: 'Therapy / talk therapy', icon: '🗣️', specialties: ['Psychology'] },
      { label: 'Medication management', icon: '💊', specialties: ['Psychiatry'] },
      {
        label: 'Addiction or substance use',
        icon: '🔄',
        specialties: ['Psychiatry', 'Psychology'],
      },
      { label: "Children's mental health", icon: '👧', specialties: ['Psychiatry', 'Psychology'] },
    ],
  },
  skin: {
    id: 'skin',
    question: "What's your main concern?",
    options: [
      { label: 'Rashes, acne, or skin conditions', icon: '🌡️', specialties: ['Dermatology'] },
      { label: 'Skin cancer screening', icon: '🔍', specialties: ['Dermatology'] },
      { label: 'Cosmetic concerns', icon: '✨', specialties: ['Dermatology'] },
    ],
  },
  bones: {
    id: 'bones',
    question: 'What type of issue?',
    options: [
      { label: 'Joint replacement or surgery', icon: '🦿', specialties: ['Orthopedics'] },
      {
        label: 'Arthritis or chronic joint pain',
        icon: '🤕',
        specialties: ['Rheumatology', 'Orthopedics'],
      },
      { label: 'Sports injury', icon: '⚽', specialties: ['Orthopedics'] },
      { label: 'Back or spine pain', icon: '🦴', specialties: ['Orthopedics', 'Neurology'] },
    ],
  },
  digestive: {
    id: 'digestive',
    question: 'What digestive concern?',
    options: [
      {
        label: 'Stomach pain or acid reflux',
        icon: '🤢',
        specialties: ['Gastroenterology', 'Internal Medicine'],
      },
      { label: 'Colonoscopy or screening', icon: '🔬', specialties: ['Gastroenterology'] },
      { label: 'Liver or pancreas issues', icon: '🫀', specialties: ['Gastroenterology'] },
    ],
  },
  womens: {
    id: 'womens',
    question: "What type of women's health concern?",
    options: [
      {
        label: 'Routine checkup or pap smear',
        icon: '🌸',
        specialties: ['Obstetrics & Gynecology'],
      },
      { label: 'Pregnancy or fertility', icon: '🤰', specialties: ['Obstetrics & Gynecology'] },
      {
        label: 'Menopause or hormones',
        icon: '⚕️',
        specialties: ['Obstetrics & Gynecology', 'Internal Medicine'],
      },
    ],
  },
  other: {
    id: 'other',
    question: 'Pick the area closest to your concern',
    options: [
      { label: 'Hormones or thyroid', icon: '🦋', specialties: ['Endocrinology'] },
      { label: 'Kidneys or urinary tract', icon: '💧', specialties: ['Nephrology', 'Urology'] },
      { label: 'Lungs or breathing', icon: '🫁', specialties: ['Pulmonology'] },
      { label: 'Nervous system / headaches', icon: '🧬', specialties: ['Neurology'] },
      { label: 'Blood disorders', icon: '🩸', specialties: ['Hematology'] },
      {
        label: 'Immune system or allergies',
        icon: '🤧',
        specialties: ['Allergy & Immunology', 'Rheumatology'],
      },
      { label: 'Surgery referral', icon: '🏥', specialties: ['General Surgery'] },
    ],
  },
};

// ─── Specialty slug map ───────────────────────────────────────────────────────

const SPECIALTY_SLUGS: Record<string, string> = {
  Cardiology: 'cardiology',
  'Internal Medicine': 'internal-medicine',
  'Family Medicine': 'family-medicine',
  Psychiatry: 'psychiatry',
  Psychology: 'psychology',
  Dermatology: 'dermatology',
  Orthopedics: 'orthopedics',
  Rheumatology: 'rheumatology',
  Oncology: 'oncology',
  Pediatrics: 'pediatrics',
  'Obstetrics & Gynecology': 'obstetrics-gynecology',
  Gastroenterology: 'gastroenterology',
  Neurology: 'neurology',
  Ophthalmology: 'ophthalmology',
  Otolaryngology: 'otolaryngology',
  Endocrinology: 'endocrinology',
  Nephrology: 'nephrology',
  Urology: 'urology',
  Pulmonology: 'pulmonology',
  Hematology: 'hematology',
  'Allergy & Immunology': 'allergy-immunology',
  'Vascular Surgery': 'vascular-surgery',
  'General Surgery': 'general-surgery',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FindPage() {
  const [stepId, setStepId] = useState<string>('start');
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<string[] | null>(null);

  const step = STEPS[stepId];

  function handleOption(opt: (typeof step.options)[number]) {
    if (opt.specialties) {
      setResult(opt.specialties);
    } else if (opt.next) {
      setHistory((h) => [...h, stepId]);
      setStepId(opt.next);
    }
  }

  function handleBack() {
    if (result) {
      setResult(null);
    } else if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setStepId(prev);
    }
  }

  function handleReset() {
    setStepId('start');
    setHistory([]);
    setResult(null);
  }

  const progressSteps = history.length + (result ? 1 : 0);
  const maxSteps = 2;
  const progress = Math.min((progressSteps / maxSteps) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            Specialty Finder
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Find the Right Specialist</h1>
          <p className="mt-2 text-gray-500">
            Answer a few quick questions and we&apos;ll match you with the right type of specialist.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${result ? 100 : progress}%` }}
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {result ? (
            /* Result screen */
            <div>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-emerald-600">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {result.length === 1 ? 'We recommend:' : 'Consider these specialists:'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Browse providers in California by specialty below
                </p>
              </div>

              <div className="space-y-3">
                {result.map((name) => {
                  const slug = SPECIALTY_SLUGS[name];
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{name}</p>
                        {slug && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Find {name} providers near you
                          </p>
                        )}
                      </div>
                      {slug ? (
                        <Link
                          href={`/search?q=${encodeURIComponent(name)}`}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          Browse →
                        </Link>
                      ) : (
                        <Link
                          href={`/search?q=${encodeURIComponent(name)}`}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          Browse →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Start over
                </button>
              </div>
            </div>
          ) : (
            /* Question screen */
            <div>
              <h2 className="mb-5 text-lg font-bold text-gray-900">{step.question}</h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {step.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleOption(opt)}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-left text-sm font-medium text-gray-800 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                  >
                    <span className="flex-shrink-0 text-lg">{opt.icon}</span>
                    <span className="leading-snug">{opt.label}</span>
                  </button>
                ))}
              </div>

              {history.length > 0 && (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          This tool helps you find the right specialist type — it&apos;s not medical advice. Always
          consult a licensed provider.
        </p>
      </div>
    </div>
  );
}
