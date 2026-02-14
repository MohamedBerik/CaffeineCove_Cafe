import { useParams } from "react-router-dom";
import PurchaseOrderReturns from "./ReturnItems";

export default function PurchaseOrderReturnsPage() {
  const { id } = useParams();

  return (
    <div>
      <PurchaseOrderReturns purchaseOrderId={id} />
    </div>
  );
}
