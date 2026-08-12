<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExcelImport\ImportExcelRequest;
use App\Services\ExcelImport\ExcelReader;
use App\Services\ExcelImport\ImportExecutor;
use App\Services\ExcelImport\ImportPlanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class ExcelImportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/excel-import', [
            'result' => Session::pull('excel_import_result'),
        ]);
    }

    public function preview(ImportExcelRequest $request): Response
    {
        $path = $request->file('file')->getRealPath();
        $workbook = app(ExcelReader::class)->readDataKelompok($path);
        $plan = app(ImportPlanner::class)->plan($workbook);

        return Inertia::render('admin/excel-import', [
            'plan' => $plan->toArray(),
        ]);
    }

    public function execute(ImportExcelRequest $request): RedirectResponse
    {
        try {
            $path = $request->file('file')->getRealPath();
            $workbook = app(ExcelReader::class)->readDataKelompok($path);
            $plan = app(ImportPlanner::class)->plan($workbook);
            $result = app(ImportExecutor::class)->execute($plan);
        } catch (\Throwable $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Import gagal: :message', ['message' => $e->getMessage()]),
            ]);

            return back();
        }

        Session::flash('excel_import_result', $result->toArray());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Import selesai: :santri santri, :ustadz ustadz.', [
                'santri' => $result->santriCreated,
                'ustadz' => $result->ustadzCreated,
            ]),
        ]);

        return back();
    }
}
