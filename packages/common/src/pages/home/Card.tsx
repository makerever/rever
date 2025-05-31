import { CardProps } from "@rever/types";

function Card({ heading, icon, value }: CardProps) {
  return (
    <>
      <div className="shadow-4xl rounded-md text-slate-800 min-w-32 px-5 flex items-start justify-center flex-col gap-3 h-28">
        <div className="flex items-center justify-between w-full">
          <p className="text-sm">{heading}</p>
          {icon}
        </div>
        <div className="font-semibold">{value}</div>
      </div>
    </>
  );
}

export default Card;
