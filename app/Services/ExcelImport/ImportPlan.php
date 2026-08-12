<?php

namespace App\Services\ExcelImport;

use Illuminate\Support\Collection;

final class ImportPlan
{
    /** @param  Collection<int, ImportPlanItem>  $items */
    public function __construct(public readonly Collection $items) {}

    /** @return array<string, int> */
    public function summary(): array
    {
        $byAction = fn (string $type) => $this->items->where('type', $type)->countBy(fn ($i) => $i->action->value)->all();

        return [
            'ustadz' => $byAction('ustadz'),
            'halaqah' => $byAction('halaqah'),
            'santri' => $byAction('santri'),
        ];
    }

    /** @return array{summary: array<string, int>, items: list<array<string, mixed>>} */
    public function toArray(): array
    {
        return [
            'summary' => $this->summary(),
            'items' => $this->items->map(fn (ImportPlanItem $item) => $item->toArray())->all(),
        ];
    }
}
