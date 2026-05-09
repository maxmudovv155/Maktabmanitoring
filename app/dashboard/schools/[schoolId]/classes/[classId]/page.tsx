import { Suspense } from "react";

import { ClassStudentsLoader } from "@/components/students/class-students-loader";

type PageProps = {
  params: Promise<{
    schoolId: string;
    classId: string;
  }>;
};

export default async function ClassStudentsPage(props: PageProps) {
  const { schoolId, classId } = await props.params;

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Sinf yuklanmoqda...</div>}>
      <ClassStudentsLoader schoolId={schoolId} classId={classId} />
    </Suspense>
  );
}
