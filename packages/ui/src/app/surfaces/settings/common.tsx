import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tajdin/ui/components/card';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@tajdin/ui/components/field';

export function Section({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

/** A label + description on the left, the control on the right. */
export function SettingRow({ id, label, description, children }: { id?: string; label: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Field orientation="horizontal" className="items-center justify-between gap-6">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <div className="shrink-0">{children}</div>
    </Field>
  );
}
