import { useNavigate } from "react-router-dom";

const plans = [
  {
    title: "Basic",
    price: "$0",
    desc: "Simple monitoring and basic alerts",
  },
  {
    title: "Pro",
    price: "$9/mo",
    desc: "Advanced alerts and better tracking",
  },
  {
    title: "AI+",
    price: "$19/mo",
    desc: "AI assistant and premium insights",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050816] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-4xl font-bold">Choose your plan</h1>
        <p className="mb-10 text-white/65">
          Start simple and upgrade later
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-2xl font-semibold">{plan.title}</h2>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <p className="mt-4 text-white/65">{plan.desc}</p>

              <button
                onClick={() => navigate("/dashboard")}
                className="mt-8 w-full rounded-2xl bg-white px-5 py-3 font-medium text-black"
              >
                Select plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}