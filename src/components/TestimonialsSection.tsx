import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WhatsAppChatProps {
  name: string;
  text: string;
  time: string;
  groupName: string;
  emoji: string;
  delay: number;
}

const WhatsAppChat = ({ name, text, time, groupName, emoji, delay }: WhatsAppChatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="w-full"
  >
    {/* WhatsApp Header */}
    <div className="bg-[#008069] dark:bg-[#1F2C33] rounded-t-xl px-3 py-2.5 flex items-center gap-2.5">
      {/* Avatar */}
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-[#DFE5E7] dark:bg-[#6B7C85] flex items-center justify-center">
          <span className="text-base">{emoji}</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#25D366] rounded-full border-2 border-[#008069] dark:border-[#1F2C33]" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate">
          {groupName}
        </h3>
        <p className="text-[#B5D1CD] dark:text-[#8696A0] text-[11px]">
          en línea
        </p>
      </div>
    </div>

    {/* Chat Background */}
    <div 
      className="relative px-3 py-4 min-h-[120px] bg-[#ECE5DD] dark:bg-[#0B141A]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5baaf' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Dark mode pattern overlay */}
      <div 
        className="hidden dark:block absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Message bubble */}
      <div className="relative z-10 flex justify-start">
        <div className="relative max-w-[90%]">
          {/* Bubble tail */}
          <div className="absolute -left-2 top-0 w-3 h-3 overflow-hidden">
            <div className="absolute top-0 left-1.5 w-3 h-3 bg-[#DCF8C6] dark:bg-[#025C4C] rotate-45 transform origin-bottom-left" />
          </div>
          
          {/* Bubble */}
          <div className="relative bg-[#DCF8C6] dark:bg-[#025C4C] rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
            <p className="text-xs font-semibold text-[#25D366] dark:text-[#34B7F1] mb-1">
              {name}
            </p>
            <p className="text-sm text-[#111B21] dark:text-[#E9EDEF] leading-relaxed pr-12">
              {text}
            </p>
            <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
              <span className="text-[10px] text-[#667781] dark:text-[#8696A0]">
                {time}
              </span>
              <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Input Bar */}
    <div className="bg-[#F0F2F5] dark:bg-[#1F2C33] rounded-b-xl px-2.5 py-2 flex items-center gap-2">
      <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-3 py-1.5">
        <span className="text-xs text-[#667781] dark:text-[#8696A0]">
          Mensaje...
        </span>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#008069] dark:bg-[#00A884] flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
        </svg>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => {
  const { t } = useLanguage();

  const testimonials = [
    {
      name: t("testimonialCard1.name"),
      text: t("testimonialCard1.text"),
      time: "14:32",
      groupName: "Club DJs MX 🇲🇽",
      emoji: "🎵",
    },
    {
      name: t("testimonialCard2.name"),
      text: t("testimonialCard2.text"),
      time: "18:45",
      groupName: "DJs Latinos 🔥",
      emoji: "🎧",
    },
    {
      name: t("testimonialCard3.name"),
      text: t("testimonialCard3.text"),
      time: "21:15",
      groupName: "Pool Hunters 💎",
      emoji: "🎤",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-muted/30 dark:bg-background-carbon">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl lg:text-6xl text-foreground">
            {t("testimonialCard.title")}
          </h2>
          <p className="font-sans text-lg text-muted-foreground">
            {t("testimonialCard.subtitle")}
          </p>
        </motion.div>

        {/* Grid de 3 chats de WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <WhatsAppChat
              key={index}
              name={testimonial.name}
              text={testimonial.text}
              time={testimonial.time}
              groupName={testimonial.groupName}
              emoji={testimonial.emoji}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
