export function getClientDisplayName(client?: {
    company_name?: string;
    name?: string;
    full_name?: string;
    email?: string;
}) {
    return (
        client?.company_name ||
        client?.name ||
        client?.full_name ||
        client?.email ||
        "Not Assigned"
    );
}
