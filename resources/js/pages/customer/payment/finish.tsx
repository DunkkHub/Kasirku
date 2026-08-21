import { OrderOutcome } from '@/components/customer/order-outcome';

interface Props {
    order_id: string;
}

export default function PaymentFinish({ order_id }: Props) {
    return (
        <OrderOutcome
            variant="success"
            title="Paiement accepté"
            description="Merci ! Votre commande a été transmise à l’équipe. Suivez sa préparation en temps réel."
            primaryHref={`/order/${order_id}/status`}
            primaryLabel="Suivre ma commande"
        />
    );
}
