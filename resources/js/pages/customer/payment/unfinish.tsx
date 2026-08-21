import { OrderOutcome } from '@/components/customer/order-outcome';

export default function PaymentUnfinish() {
    return (
        <OrderOutcome
            variant="pending"
            title="Paiement non terminé"
            description="La fenêtre de paiement a été fermée avant la confirmation. La carte publique fonctionne maintenant comme menu digital."
            primaryHref="/"
            primaryLabel="Retour à la carte"
        />
    );
}
