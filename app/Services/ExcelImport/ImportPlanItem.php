<?php

namespace App\Services\ExcelImport;

final readonly class ImportPlanItem
{
    /**
     * @param  array<string, mixed>  $extra
     */
    public function __construct(
        public string $type, // 'ustadz' | 'halaqah' | 'santri'
        public ImportAction $action,
        public string $groupKey,
        public string $nama,
        public ?string $email = null,
        public ?string $nis = null,
        public ?string $jenis = null,
        public ?string $kelompok = null,
        public ?int $halamanAwal = null,
        public ?int $existingId = null,
        public ?string $reason = null,
        public array $extra = [],
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'action' => $this->action->value,
            'action_label' => $this->action->label(),
            'group_key' => $this->groupKey,
            'nama' => $this->nama,
            'email' => $this->email,
            'nis' => $this->nis,
            'jenis' => $this->jenis,
            'kelompok' => $this->kelompok,
            'halaman_awal' => $this->halamanAwal,
            'existing_id' => $this->existingId,
            'reason' => $this->reason,
            'extra' => $this->extra,
        ];
    }
}
