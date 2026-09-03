<?php

use App\Helpers\PekanHelper;
use Carbon\Carbon;

it('pekan number is 3 for 19 May 2024', function () {
    expect(PekanHelper::pekanNumberInMonth(Carbon::parse('2024-05-19')))->toBe(3);
});

it('week range monday-sunday for sunday 2024-05-19', function () {
    $r = PekanHelper::weekRange(Carbon::parse('2024-05-19'));

    expect($r['senin']->toDateString())->toBe('2024-05-13');
    expect($r['ahad']->toDateString())->toBe('2024-05-19');
});

it('grade mapping 85 => B', function () {
    expect(PekanHelper::gradeLabel(85))->toBe('B');
});

it('counts mondays in month for pekanCountInMonth', function () {
    // May 2024 has Mondays on 6, 13, 20, 27 => 4
    expect(PekanHelper::pekanCountInMonth(2024, 5))->toBe(4);
    // September 2024 has Mondays on 2, 9, 16, 23, 30 => 5
    expect(PekanHelper::pekanCountInMonth(2024, 9))->toBe(5);
});

it('gradeLabel handles boundaries and null', function () {
    expect(PekanHelper::gradeLabel(null))->toBe('-');
    expect(PekanHelper::gradeLabel(95))->toBe('A');
    expect(PekanHelper::gradeLabel(90))->toBe('A');
    expect(PekanHelper::gradeLabel(80))->toBe('B');
    expect(PekanHelper::gradeLabel(70))->toBe('C');
    expect(PekanHelper::gradeLabel(60))->toBe('D');
    expect(PekanHelper::gradeLabel(59))->toBe('E');
    expect(PekanHelper::gradeLabel(0))->toBe('E');
});
