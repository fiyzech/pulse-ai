import React from "react";

import editIcon from "../../assets/icons/pencil-edit.svg";
import trashIcon from "../../assets/icons/trash.svg";
import alarm from "../../assets/icons/alarm.svg";
import question from "../../assets/icons/question-mark.svg";

const tableGrid =
  "grid grid-cols-[1.25fr_1.15fr_0.95fr_1fr_1fr_96px]";

export default function AlertsPage() {
  const stats = [
    { title: "Активні алерти", value: "3", icon: alarm },
    { title: "Спрацювали сьогодні", value: "1" },
    { title: "Telegram підключено", value: "Так" },
    { title: "Останнє сповіщення", value: "1 година тому" },
  ];

  const alerts = [
    {
      symbol: "BTC/USDT",
      condition: "Вище $80,000",
      price: "$76,889",
      status: "Активний",
      telegram: "Підключено",
      color: "bg-orange-500",
    },
    {
      symbol: "ETH/USDT",
      condition: "Нижче $3,200",
      price: "$3,260",
      status: "Активний",
      telegram: "Підключено",
      color: "bg-purple-500",
    },
    {
      symbol: "SOL/USDT",
      condition: "Вище $85,00",
      price: "$83,80",
      status: "Активний",
      telegram: "Підключено",
      color: "bg-[#14F195]",
    },
  ];

  return (
    <div className="w-full px-[40px] pt-[24px] pb-8 text-white font-montserrat">
      {/* TOP */}
      <div className="flex justify-between items-start mb-[24px]">
        <p className="text-white text-[16px] leading-[28px] max-w-[546px] font-normal">
          Створюйте алерти на сайті та отримуйте сповіщення в Telegram,
          коли задана умова буде виконана
        </p>

        <div className="relative group">
          <button
            className="
              flex items-center gap-[10px]
              text-white text-[16px] leading-[28px] font-medium
              transition-all duration-300 cursor-pointer 
            "
          >
            Як створити алерт


              <img
                src={question}
                alt="Question"
                className="w-[18px] h-[18px]"
              />
            </button>

          <div
            className="
             absolute right-0 top-[35px] z-50 w-[288px] p-[1px] rounded-[28px]
             bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]
             opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out"
          >
            <div className="rounded-[28px] bg-[#050506] px-[24px] py-[24px]">
              <div className="flex items-start gap-[10px]">

                <p className="text-[#A3A4B0] text-[14px] leading-[17px] font-normal">
                  Перейдіть на сторінку потрібної 
                  <br />
                  криптовалюти, задайте умову
                  <br />
                  ціни та період сповіщення.
                  <br />
                  Після створення алерт 
                  <br />
                  автоматично з’явиться на цій
                  <br />
                  сторінці, а сповіщення 
                  <br />
                  надходитимуть у Telegram.

                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-[24px] mb-[24px] w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="h-[110px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_80px_rgba(131,72,193,0.19),0_8px_25px_rgba(0,0,0,0.5)]"
          >
            <div className="relative h-full rounded-[28px] bg-[#050506] p-5 text-center overflow-hidden flex flex-col items-center justify-center">
              <p className="text-white text-[14px] font-normal">
                {stat.title}
              </p>

              <div className="flex items-center justify-center gap-2 mt-2">
                <h2 className="text-[28px] leading-none font-medium text-white">
                  {stat.value}
                </h2>

                {stat.icon && (
                  <img src={stat.icon} alt="" className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
        <div className="rounded-[28px] bg-[#050506] overflow-hidden">
          {/* HEADER */}
          <div
            className={`relative ${tableGrid} items-center px-[24px] h-[57px] text-[#A3A4B0] text-[14px] font-normal bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)]`}
          >
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))]" />

            <span>Валюта</span>
            <span>Умова</span>
            <span>Поточна ціна</span>
            <span>Статус</span>
            <span>Telegram</span>
            <span>Дії</span>
          </div>

          {alerts.map((alert, index) => (
            <React.Fragment key={alert.symbol}>
              {/* ROW */}
              <div
                className={`${tableGrid} items-center px-[24px] h-[76px] transition-all duration-300 ease-out`}
              >
                {/* Валюта */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${alert.color}`} />
                  <p className="text-[14px] font-medium text-white">
                    {alert.symbol}
                  </p>
                </div>

                {/* Умова */}
                <p className="text-[14px] font-normal text-white">
                  {alert.condition}
                </p>

                {/* Ціна */}
                <p className="text-[14px] font-normal text-white">
                  {alert.price}
                </p>

                {/* Статус */}
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full px-4 py-[6px] text-[12px] bg-[#25DE28]/10 text-[#25DE28] font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#25DE28]" />
                    {alert.status}
                  </span>
                </div>

                {/* Telegram */}
                <p className="text-[14px] font-normal text-white">
                  {alert.telegram}
                </p>

                {/* Дії */}
                <div className="flex items-center gap-[16px]">
                  {/* EDIT */}
                  <button className="group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(131,72,193,0.28)] active:scale-95 cursor-pointer">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#0B0B0D]">
                      <img
                        src={editIcon}
                        alt=""
                        className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125"
                      />
                    </div>
                  </button>

                  {/* DELETE */}
                  <button className="group relative inline-flex w-8 h-8 items-center justify-center rounded-full p-[1px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] hover:bg-[linear-gradient(90deg,#1C102F_0%,#FF4444_100%)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,68,68,0.35)] active:scale-95 cursor-pointer">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#050506] transition-all duration-300 group-hover:bg-[#140707]">
                      <img
                        src={trashIcon}
                        alt=""
                        className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125"
                      />
                    </div>
                  </button>
                </div>
              </div>

              {index !== alerts.length - 1 && (
                <div className="px-[24px]">
                  <div className="h-[1px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32)_0%,rgba(179,179,179,0.032)_100%)]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-center text-[#A3A4B0] text-[14px] font-normal leading-[18px] mt-[24px]">
        Сповіщення про спрацювання алертів надсилаються в Telegram
      </p>
    </div>
  );
}