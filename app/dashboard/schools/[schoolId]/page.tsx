import { ClassesHub } from "@/components/classes/classes-hub";

type PageProps = {
  params: Promise<{
    schoolId: string;
  }>;
};

export default async function SchoolDetailPage(props: PageProps) {
  const { schoolId } = await props.params;
  return <ClassesHub schoolId={schoolId} />;
}
