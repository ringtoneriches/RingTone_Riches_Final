import React from "react";
import Countdown, { zeroPad } from "react-countdown";

const GLOBAL_START_DATE = new Date("2025-10-30T00:00:00Z"); // <-- same for all users
const GLOBAL_END_DATE = new Date(GLOBAL_START_DATE.getTime() + 60 * 24 * 60 * 60 * 1000);

interface CountdownTimerProps {
  endDate?: string | Date | null;
}

const CountdownTimer = ({ endDate }: CountdownTimerProps) => {
  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: any) => {
    if (completed) return <span className="text-green-500 font-semibold">🎉 Countdown complete!</span>;

    return (
      <div className="flex items-center justify-center gap-3 text-center">
        <TimeBox label="Days" value={days} />
        <Colon />
        <TimeBox label="Hours" value={hours} />
        <Colon />
        <TimeBox label="Mins" value={minutes} />
        <Colon />
        <TimeBox label="Sec" value={seconds} />
      </div>
    );
  };

  // Use provided endDate or fallback to global default
const targetDate = endDate
  ? new Date(endDate).getTime()
  : GLOBAL_END_DATE.getTime();


  return (
    <div className="p-4 bg-black/30 rounded-2xl shadow-md w-full max-w-lg mx-auto">
      <Countdown date={targetDate} renderer={renderer} />
    </div>
  );
};

const TimeBox = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl font-bold text-yellow-400">{zeroPad(value)}</span>
    <span className="text-sm text-gray-400">{label}</span>
  </div>
);

const Colon = () => <span className="text-yellow-500 font-bold text-2xl">:</span>;

export default CountdownTimer;