import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SellerStorefrontRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/shops/${slug}`);
}
