<?php

namespace App\Models;

use Database\Factories\PondokFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $nama_yayasan
 * @property string $slug
 * @property string|null $logo_path
 */
#[Fillable(['nama_yayasan', 'slug', 'logo_path'])]
class Pondok extends Model
{
    /** @use HasFactory<PondokFactory> */
    use HasFactory;

    public function logoUrl(): ?string
    {
        return $this->logo_path ? Storage::url($this->logo_path) : null;
    }
}
