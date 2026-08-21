import { OrderOutcome } from '@/components/customer/order-outcome';

export default function PaymentError() {
    return (
        <OrderOutcome
            variant="error"
            title="Le paiement a échoué"
            description="Votre paiement n’a pas pu être validé. La commande en ligne n’est plus proposée depuis la carte digitale."
            primaryHref="/"
            primaryLabel="Retour à la carte"
        />
    );
}
