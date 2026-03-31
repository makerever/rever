// Card component to display summary information

import { CardProps } from "@rever/types";
import { useCountAnimation } from "@rever/common";
import { formatNumber, formatPlainNumber } from "@rever/utils";
import { useTranslate } from "@rever/i18n";

function Card({ heading, value }: CardProps) {
  const translate = useTranslate();
  const animatedAmount = useCountAnimation(value?.amount, 500);

  return (
    <>
      <div className="rounded-[20px] p-4 bg-white border border-secondary-200 h-44 flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-3 text-secondary-700 gap-1.5">
            <p className="text-sm font-medium">{heading}</p>
            {/* <Info width={16} /> */}
          </div>
          <div className="font-medium text-2xl text-neutral-1100">
            {formatNumber(animatedAmount, undefined, undefined, true)}
          </div>
        </div>

        <p className="mt-6 text-sm text-neutral-1100 font-medium">
          {formatPlainNumber(value?.count, false, 0, 2)} {translate("home.charts.bills").toLowerCase()}
        </p>
      </div>
    </>
  );
}

export default Card;
