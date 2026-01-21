import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, ShieldCheck } from "lucide-react";

const testimonials = [
  {
    id: 1,
    message: "Bro, me salvaste el evento, la calidad está increíble. 🔥",
    time: "14:32",
    name: "DJ Carlos",
  },
  {
    id: 2,
    message: "Al fin un pool que tiene cumbias y wepas bien organizados. 🙌",
    time: "18:45",
    name: "DJ Memo",
  },
  {
    id: 3,
    message: "Descargué 200GB en una noche con Air Explorer. Esto es otro nivel. 💪",
    time: "22:15",
    name: "DJ Andrés",
  },
];

const TrustSecuritySection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient opacity-20" />

      <div className="container relative z-10 mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
            <ShieldCheck className="h-4 w-4" />
            Pagos 100% Seguros
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
            Confianza y{" "}
            <span className="text-gradient-red">Seguridad</span>
          </h2>
        </motion.div>

        {/* Payment Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16 flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {/* Stripe */}
          <div className="grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100">
            <svg className="h-10 w-auto" viewBox="0 0 120 50" fill="currentColor">
              <text x="0" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="40" fontWeight="700">Stripe</text>
            </svg>
          </div>

          {/* Visa */}
          <div className="grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100">
            <svg className="h-8 w-auto" viewBox="0 0 750 471" fill="currentColor">
              <path d="M278.2 334.2l33.8-190.7h54l-33.8 190.7h-54zM524.9 148.4c-10.7-4-27.4-8.2-48.3-8.2-53.3 0-90.9 26.9-91.2 65.5-.3 28.5 26.8 44.4 47.3 53.9 21 9.7 28.1 15.9 28 24.6-.1 13.3-16.8 19.4-32.3 19.4-21.6 0-33.1-3-50.8-10.5l-7-3.2-7.6 44.4c12.6 5.5 36 10.3 60.2 10.6 56.7 0 93.5-26.6 93.9-67.8.2-22.6-14.2-39.8-45.3-54-18.9-9.2-30.5-15.3-30.4-24.6 0-8.2 9.8-17 31-17 17.7-.3 30.5 3.6 40.5 7.6l4.9 2.3 7.4-43zM661.6 143.5h-41.7c-12.9 0-22.6 3.5-28.3 16.4l-80.1 181.7h56.6s9.3-24.4 11.4-29.8c6.2 0 61.1.1 69 .1 1.6 7 6.5 29.7 6.5 29.7h50l-43.6-198.1h.2zm-66.4 128c4.5-11.4 21.5-55.4 21.5-55.4-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47.2 12.5 57.2h-44.7zM232.4 143.5l-52.8 130-5.6-27.3c-9.8-31.5-40.3-65.6-74.5-82.7l48.3 170.6 57.1-.1 84.9-190.5h-57.4z"/>
              <path d="M131.9 143.5H46.7l-.7 4c67.7 16.4 112.5 56 131.1 103.6l-18.9-91c-3.3-12.6-12.8-16.2-26.3-16.6z" fill="#F9A51A"/>
            </svg>
          </div>

          {/* MasterCard */}
          <div className="grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100">
            <svg className="h-10 w-auto" viewBox="0 0 152.407 108" fill="none">
              <rect width="152.407" height="108" rx="8" fill="currentColor" fillOpacity="0.1"/>
              <circle cx="60" cy="54" r="30" fill="#EB001B"/>
              <circle cx="92" cy="54" r="30" fill="#F79E1B"/>
              <path d="M76 30.9a30 30 0 0 0 0 46.2 30 30 0 0 0 0-46.2z" fill="#FF5F00"/>
            </svg>
          </div>

          {/* PayPal */}
          <div className="grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100">
            <svg className="h-8 w-auto" viewBox="0 0 124 33" fill="currentColor">
              <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/>
              <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/>
            </svg>
          </div>
        </motion.div>

        {/* WhatsApp Style Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-16 max-w-lg"
        >
          <div className="rounded-2xl bg-[#0b141a] p-6 shadow-2xl">
            {/* WhatsApp Header */}
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                🎧
              </div>
              <div>
                <p className="font-semibold text-white">DJs Satisfechos</p>
                <p className="text-xs text-gray-400">+1,500 miembros activos</p>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-[120px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-end"
                >
                  <div className="relative max-w-[85%]">
                    {/* WhatsApp bubble tail */}
                    <div className="absolute -right-2 top-0 h-4 w-4 overflow-hidden">
                      <div className="h-4 w-4 origin-bottom-left rotate-45 transform bg-[#005c4b]" />
                    </div>
                    
                    {/* Message bubble */}
                    <div className="rounded-lg rounded-tr-none bg-[#005c4b] px-4 py-3 text-white shadow-lg">
                      <p className="text-[15px] leading-relaxed">
                        {testimonials[currentTestimonial].message}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span className="text-[11px] text-gray-300">
                          {testimonials[currentTestimonial].time}
                        </span>
                        <CheckCheck className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    
                    {/* Sender name */}
                    <p className="mt-1 text-right text-xs text-gray-500">
                      — {testimonials[currentTestimonial].name}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots indicator */}
            <div className="mt-4 flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? "w-6 bg-green-500"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Guarantee Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-card/30 px-6 py-3 backdrop-blur-sm">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Cancela cuando quieras.</span>{" "}
              Sin contratos forzosos ni letras chiquitas.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSecuritySection;
