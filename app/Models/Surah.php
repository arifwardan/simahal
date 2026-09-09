<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $nomor
 * @property string $nama_latin
 * @property string $nama_arab
 * @property int $jumlah_ayat
 * @property int $juz
 */
class Surah extends Model
{
    /** @use HasFactory<Surah> */
    use HasFactory;

    protected $fillable = ['nomor', 'nama_latin', 'nama_arab', 'jumlah_ayat', 'juz'];

    protected function casts(): array
    {
        return ['nomor' => 'integer', 'jumlah_ayat' => 'integer', 'juz' => 'integer'];
    }
}
