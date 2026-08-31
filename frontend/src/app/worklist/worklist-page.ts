import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthSession } from '../authentication/auth-session';
import { CancelExamDialog } from './cancel-exam-dialog';
import { ScheduleApi } from './schedule-api';
import { ScheduleFormDialog } from './schedule-form-dialog';
import { ExamView, localDateKey, MODALITY_OPTIONS, Modality, patientName } from './schedule';

interface CalendarDay {
  date: Date;
  key: string;
  isToday: boolean;
}

interface TimeSlot {
  time: string;
  label: string;
  isPast: boolean;
  exams: ExamView[];
}

@Component({
  selector: 'app-worklist-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <header class="page-header">
      <div>
        <p class="eyebrow">Exam management</p>
        <h1>Worklist</h1>
        <p>Schedule, reschedule and cancel synthetic patient examinations.</p>
      </div>
      @if (canSchedule()) {
        <button
          mat-flat-button
          type="button"
          [disabled]="orderedExams().length === 0"
          (click)="openSchedule()"
        >
          <mat-icon svgIcon="add"></mat-icon>
          Schedule exam
        </button>
      }
    </header>

    <section class="implementation-note" aria-label="Scheduling implementation status">
      <mat-icon svgIcon="info"></mat-icon>
      <div>
        <strong>Prototype scheduling data</strong>
        <span>
          The scheduling API is still planned. Times shown here are start-time choices, not
          confirmed equipment availability.
        </span>
      </div>
    </section>

    @if (error()) {
      <mat-card appearance="outlined" class="error-card" role="alert">
        <mat-card-content>
          {{ error() }}
          <button mat-button type="button" (click)="load()">Try again</button>
        </mat-card-content>
      </mat-card>
    }

    @if (loading()) {
      <div class="loading-state">
        <mat-spinner diameter="42" />
        <p>Loading appointments…</p>
      </div>
    } @else if (!error()) {
      <div class="schedule-layout">
        <mat-card appearance="outlined" class="calendar-card">
          <div class="calendar-toolbar">
            <div class="week-navigation">
              <button
                mat-icon-button
                type="button"
                matTooltip="Previous week"
                (click)="moveWeek(-1)"
              >
                <mat-icon svgIcon="chevron_left"></mat-icon>
              </button>
              <button mat-stroked-button type="button" (click)="goToToday()">Today</button>
              <button mat-icon-button type="button" matTooltip="Next week" (click)="moveWeek(1)">
                <mat-icon svgIcon="chevron_right"></mat-icon>
              </button>
              <h2>{{ weekLabel() }}</h2>
            </div>

            <div class="filters" aria-label="Appointment filters">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Modality</mat-label>
                <mat-select
                  [value]="modalityFilter()"
                  (selectionChange)="modalityFilter.set($event.value)"
                >
                  <mat-option value="ALL">All modalities</mat-option>
                  @for (option of modalityOptions; track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Station</mat-label>
                <mat-select
                  [value]="stationFilter()"
                  (selectionChange)="stationFilter.set($event.value)"
                >
                  <mat-option value="ALL">All stations</mat-option>
                  @for (station of stations(); track station) {
                    <mat-option [value]="station">{{ station }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="day-picker" role="tablist" aria-label="Days in selected week">
            @for (day of weekDays(); track day.key) {
              <button
                type="button"
                role="tab"
                [class.selected]="day.key === selectedDate()"
                [class.today]="day.isToday"
                [attr.aria-selected]="day.key === selectedDate()"
                (click)="selectDay(day)"
              >
                <span>{{ day.date | date: 'EEE' }}</span>
                <strong>{{ day.date | date: 'd' }}</strong>
                <small>{{ appointmentCount(day.key) }} appt.</small>
              </button>
            }
          </div>

          <div class="day-heading">
            <div>
              <h3>{{ selectedDay().date | date: 'EEEE, d MMMM' }}</h3>
              <p>{{ filteredDayExams().length }} appointments shown</p>
            </div>
            @if (filtersActive()) {
              <button mat-button type="button" (click)="clearFilters()">Clear filters</button>
            }
          </div>

          <div class="timeline" aria-label="Appointment start times">
            @for (slot of timeSlots(); track slot.time) {
              <div class="time-row">
                <time [attr.datetime]="selectedDate() + 'T' + slot.time">{{ slot.label }}</time>
                <div class="slot-content">
                  @if (slot.exams.length > 0) {
                    @for (exam of slot.exams; track exam.id) {
                      <button
                        type="button"
                        class="appointment"
                        [class.selected]="selectedExamId() === exam.id"
                        [attr.data-modality]="exam.modality"
                        [attr.aria-label]="appointmentLabel(exam)"
                        (click)="selectExam(exam)"
                      >
                        <span class="modality">{{ modalityLabel(exam.modality) }}</span>
                        <span class="appointment-main">
                          <strong>{{ patientLabel(exam) }}</strong>
                          <small>{{ exam.requestedProcedure }}</small>
                        </span>
                        <span class="station">{{ exam.schedule?.stationAeTitle }}</span>
                      </button>
                    }
                  } @else if (canSchedule() && !slot.isPast && orderedExams().length > 0) {
                    <button
                      mat-button
                      type="button"
                      class="empty-slot"
                      [attr.aria-label]="'Schedule an exam at ' + slot.label"
                      (click)="openSchedule(null, selectedDate(), slot.time)"
                    >
                      <mat-icon svgIcon="add"></mat-icon>
                      Choose {{ slot.label }}
                    </button>
                  } @else {
                    <span class="unavailable-slot" aria-hidden="true">—</span>
                  }
                </div>
              </div>
            }
          </div>
        </mat-card>

        <aside>
          <mat-card appearance="outlined" class="details-card">
            @if (selectedExam(); as exam) {
              <mat-card-header>
                <mat-icon mat-card-avatar svgIcon="event"></mat-icon>
                <mat-card-title>Appointment details</mat-card-title>
                <mat-card-subtitle>{{ exam.accessionNumber }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <span class="status-badge">{{ exam.status }}</span>
                <dl>
                  <div>
                    <dt>Patient</dt>
                    <dd>{{ patientLabel(exam) }}</dd>
                  </div>
                  <div>
                    <dt>MRN</dt>
                    <dd>{{ exam.patient.medicalRecordNumber }}</dd>
                  </div>
                  <div>
                    <dt>Procedure</dt>
                    <dd>{{ exam.requestedProcedure }}</dd>
                  </div>
                  <div>
                    <dt>Modality</dt>
                    <dd>{{ modalityLabel(exam.modality) }}</dd>
                  </div>
                  <div>
                    <dt>Date and time</dt>
                    <dd>{{ exam.schedule?.scheduledStart | date: 'EEE, d MMM yyyy, HH:mm' }}</dd>
                  </div>
                  <div>
                    <dt>Station AE title</dt>
                    <dd>{{ exam.schedule?.stationAeTitle }}</dd>
                  </div>
                </dl>
              </mat-card-content>
              @if (canSchedule() || canCancel()) {
                <mat-card-actions align="end">
                  @if (canSchedule()) {
                    <button mat-button type="button" (click)="openSchedule(exam)">
                      <mat-icon svgIcon="edit_calendar"></mat-icon>
                      Reschedule
                    </button>
                  }
                  @if (canCancel()) {
                    <button
                      mat-button
                      type="button"
                      class="cancel-action"
                      (click)="confirmCancel(exam)"
                    >
                      <mat-icon svgIcon="event_busy"></mat-icon>
                      Cancel
                    </button>
                  }
                </mat-card-actions>
              }
            } @else {
              <mat-card-content class="details-empty">
                <mat-icon svgIcon="touch_app"></mat-icon>
                <h3>Appointment details</h3>
                <p>Select a scheduled exam in the calendar to view or change it.</p>
              </mat-card-content>
            }
          </mat-card>

          <mat-card appearance="outlined" class="orders-card">
            <mat-card-header>
              <mat-icon mat-card-avatar svgIcon="pending_actions"></mat-icon>
              <mat-card-title>Waiting to schedule</mat-card-title>
              <mat-card-subtitle>{{ orderedExams().length }} exam orders</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (orderedExams().length === 0) {
                <div class="queue-empty">
                  <mat-icon svgIcon="check_circle"></mat-icon>
                  <p>All current exam orders are scheduled.</p>
                </div>
              } @else {
                <div class="order-list">
                  @for (exam of orderedExams(); track exam.id) {
                    <article class="order-item">
                      <div>
                        <span class="modality-tag">{{ modalityLabel(exam.modality) }}</span>
                        <strong>{{ patientLabel(exam) }}</strong>
                        <small>{{ exam.requestedProcedure }}</small>
                        <small>{{ exam.accessionNumber }}</small>
                      </div>
                      @if (canSchedule() || canCancel()) {
                        <div class="order-actions">
                          @if (canSchedule()) {
                            <button mat-button type="button" (click)="openSchedule(exam)">
                              Schedule
                            </button>
                          }
                          @if (canCancel()) {
                            <button
                              mat-icon-button
                              type="button"
                              matTooltip="Cancel exam order"
                              [attr.aria-label]="'Cancel exam order for ' + patientLabel(exam)"
                              (click)="confirmCancel(exam)"
                            >
                              <mat-icon svgIcon="close"></mat-icon>
                            </button>
                          }
                        </div>
                      }
                    </article>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </aside>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page-header {
        align-items: flex-start;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .eyebrow {
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        letter-spacing: 0.04em;
        margin: 0 0 0.25rem;
        text-transform: uppercase;
      }
      h1 {
        font: var(--mat-sys-headline-medium);
        margin: 0 0 0.25rem;
      }
      .page-header p:not(.eyebrow) {
        color: var(--ris-text-secondary);
        margin: 0;
      }
      .implementation-note {
        align-items: flex-start;
        background: #eaf2ff;
        border: 1px solid #b8d0fa;
        border-radius: 12px;
        color: #173d70;
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.875rem 1rem;
      }
      .implementation-note div {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .implementation-note span {
        font: var(--mat-sys-body-small);
      }
      .schedule-layout {
        align-items: start;
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1fr) 360px;
      }
      .calendar-card,
      .details-card,
      .orders-card {
        overflow: hidden;
      }
      .calendar-toolbar {
        align-items: center;
        border-bottom: 1px solid var(--ris-border);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 1rem;
      }
      .week-navigation,
      .filters {
        align-items: center;
        display: flex;
        gap: 0.5rem;
      }
      .week-navigation h2 {
        font: var(--mat-sys-title-medium);
        margin: 0 0 0 0.5rem;
        white-space: nowrap;
      }
      .filters mat-form-field {
        width: 150px;
      }
      .day-picker {
        background: #fafafa;
        border-bottom: 1px solid var(--ris-border);
        display: grid;
        grid-template-columns: repeat(7, minmax(72px, 1fr));
        overflow-x: auto;
      }
      .day-picker button {
        background: transparent;
        border: 0;
        border-bottom: 3px solid transparent;
        color: var(--ris-text-secondary);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 72px;
        padding: 0.75rem 0.4rem 0.65rem;
      }
      .day-picker button + button {
        border-left: 1px solid var(--ris-border);
      }
      .day-picker button:hover {
        background: #eef4ff;
      }
      .day-picker button.selected {
        background: #e8f0fe;
        border-bottom-color: var(--mat-sys-primary);
        color: var(--mat-sys-primary);
      }
      .day-picker button.today strong {
        background: var(--mat-sys-primary);
        border-radius: 50%;
        color: white;
        display: grid;
        height: 28px;
        place-items: center;
        width: 28px;
      }
      .day-picker strong {
        align-self: center;
        font: var(--mat-sys-title-medium);
      }
      .day-picker small {
        font-size: 0.68rem;
      }
      .day-heading {
        align-items: center;
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.25rem 0.75rem;
      }
      .day-heading h3 {
        font: var(--mat-sys-title-large);
        margin: 0;
      }
      .day-heading p {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
        margin: 0.2rem 0 0;
      }
      .timeline {
        padding-bottom: 0.5rem;
      }
      .time-row {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        min-height: 62px;
      }
      .time-row > time {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-label-medium);
        padding: 0.85rem 0.75rem 0;
        text-align: right;
      }
      .slot-content {
        align-items: center;
        border-left: 1px solid var(--ris-border);
        border-top: 1px solid #eceff3;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        min-width: 0;
        padding: 0.4rem 0.75rem;
      }
      .appointment {
        align-items: center;
        background: #eef4ff;
        border: 1px solid #a8c4f5;
        border-left: 4px solid #1565c0;
        border-radius: 8px;
        color: var(--ris-text-primary);
        cursor: pointer;
        display: grid;
        gap: 0.65rem;
        grid-template-columns: auto minmax(120px, 1fr) auto;
        min-height: 46px;
        padding: 0.45rem 0.65rem;
        text-align: left;
      }
      .appointment[data-modality='MR'] {
        background: #f4efff;
        border-color: #cbb6f2;
        border-left-color: #6a3db5;
      }
      .appointment[data-modality='DX'] {
        background: #eef8f2;
        border-color: #acd4ba;
        border-left-color: #248246;
      }
      .appointment[data-modality='US'] {
        background: #fff5e8;
        border-color: #edc996;
        border-left-color: #bd6f00;
      }
      .appointment:hover,
      .appointment.selected {
        box-shadow: 0 0 0 2px var(--mat-sys-primary);
      }
      .appointment .modality,
      .modality-tag {
        font: var(--mat-sys-label-medium);
        font-weight: 700;
      }
      .appointment-main {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .appointment-main strong,
      .appointment-main small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .appointment-main small,
      .appointment .station {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
      }
      .empty-slot {
        color: var(--ris-text-secondary);
        opacity: 0.72;
      }
      .empty-slot:hover {
        opacity: 1;
      }
      .unavailable-slot {
        color: #c5c5c5;
        padding-left: 0.5rem;
      }
      aside {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: sticky;
        top: 1rem;
      }
      mat-card-header {
        padding: 1rem 1rem 0;
      }
      mat-card-header mat-icon {
        align-items: center;
        background: #e8f0fe;
        border-radius: 50%;
        color: var(--mat-sys-primary);
        display: flex;
        justify-content: center;
      }
      .details-card mat-card-content,
      .orders-card mat-card-content {
        padding-top: 1rem;
      }
      .status-badge {
        background: #e8f5e9;
        border-radius: 999px;
        color: #216a31;
        display: inline-block;
        font: var(--mat-sys-label-small);
        font-weight: 700;
        margin-bottom: 0.85rem;
        padding: 0.3rem 0.55rem;
      }
      dl {
        display: grid;
        gap: 0.8rem;
        margin: 0;
      }
      dl div {
        border-bottom: 1px solid #eeeeee;
        padding-bottom: 0.65rem;
      }
      dt {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-label-medium);
      }
      dd {
        font: var(--mat-sys-body-medium);
        font-weight: 600;
        margin: 0.15rem 0 0;
      }
      .cancel-action {
        color: var(--mat-sys-error);
      }
      .details-empty,
      .queue-empty,
      .loading-state {
        align-items: center;
        color: var(--ris-text-secondary);
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2.5rem 1rem;
        text-align: center;
      }
      .details-empty mat-icon,
      .queue-empty mat-icon {
        font-size: 38px;
        height: 38px;
        width: 38px;
      }
      .details-empty h3 {
        color: var(--ris-text-primary);
        margin: 0.75rem 0 0;
      }
      .details-empty p,
      .queue-empty p {
        margin-bottom: 0;
      }
      .order-list {
        display: flex;
        flex-direction: column;
      }
      .order-item {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
        padding: 0.85rem 0;
      }
      .order-item + .order-item {
        border-top: 1px solid var(--ris-border);
      }
      .order-item > div:first-child {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .order-item strong,
      .order-item small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .order-item small {
        color: var(--ris-text-secondary);
        font: var(--mat-sys-body-small);
      }
      .modality-tag {
        color: var(--mat-sys-primary);
        margin-bottom: 0.2rem;
      }
      .order-actions {
        align-items: center;
        display: flex;
      }
      .error-card {
        border-color: var(--mat-sys-error);
        color: var(--mat-sys-error);
        margin-bottom: 1rem;
      }
      @media (max-width: 1250px) {
        .schedule-layout {
          grid-template-columns: minmax(0, 1fr) 320px;
        }
        .calendar-toolbar {
          align-items: stretch;
          flex-direction: column;
        }
        .filters mat-form-field {
          flex: 1;
        }
      }
      @media (max-width: 900px) {
        .schedule-layout {
          grid-template-columns: 1fr;
        }
        aside {
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: static;
        }
      }
      @media (max-width: 680px) {
        .page-header {
          align-items: stretch;
          flex-direction: column;
        }
        .page-header button {
          align-self: start;
        }
        .week-navigation {
          flex-wrap: wrap;
        }
        .week-navigation h2 {
          flex-basis: 100%;
          margin: 0.25rem 0 0;
        }
        .filters {
          align-items: stretch;
          flex-direction: column;
        }
        .filters mat-form-field {
          width: 100%;
        }
        .day-picker {
          grid-template-columns: repeat(7, 72px);
        }
        .time-row {
          grid-template-columns: 56px minmax(0, 1fr);
        }
        .time-row > time {
          padding-left: 0.25rem;
          padding-right: 0.5rem;
        }
        .appointment {
          grid-template-columns: auto minmax(90px, 1fr);
          width: 100%;
        }
        .appointment .station {
          grid-column: 2;
        }
        aside {
          display: flex;
        }
      }
    `,
  ],
})
export class WorklistPage {
  private readonly api = inject(ScheduleApi);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly session = inject(AuthSession);

  readonly modalityOptions = MODALITY_OPTIONS;
  readonly exams = signal<ExamView[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedExamId = signal<number | null>(null);
  readonly selectedDate = signal(localDateKey(new Date()));
  readonly weekStart = signal(this.startOfWeek(new Date()));
  readonly modalityFilter = signal<Modality | 'ALL'>('ALL');
  readonly stationFilter = signal('ALL');
  readonly canSchedule = computed(() => this.session.hasPermission('SCHEDULE_MANAGE'));
  readonly canCancel = computed(() => this.session.hasPermission('EXAM_CANCEL'));

  readonly orderedExams = computed(() =>
    this.exams()
      .filter((exam) => exam.status === 'ORDERED' && !exam.schedule)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  );

  readonly scheduledExams = computed(() =>
    this.exams().filter((exam) => exam.status === 'SCHEDULED' && exam.schedule !== null),
  );

  readonly stations = computed(() =>
    [...new Set(this.scheduledExams().map((exam) => exam.schedule!.stationAeTitle))].sort(),
  );

  readonly weekDays = computed<CalendarDay[]>(() => {
    const today = localDateKey(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = this.addDays(this.weekStart(), index);
      const key = localDateKey(date);
      return { date, key, isToday: key === today };
    });
  });

  readonly selectedDay = computed(
    () => this.weekDays().find((day) => day.key === this.selectedDate()) ?? this.weekDays()[0],
  );

  readonly weekLabel = computed(() => {
    const days = this.weekDays();
    const first = days[0].date;
    const last = days[days.length - 1].date;
    const firstLabel = first.toLocaleDateString(undefined, {
      day: 'numeric',
      month: first.getMonth() === last.getMonth() ? undefined : 'short',
    });
    const lastLabel = last.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${firstLabel} – ${lastLabel}`;
  });

  readonly filteredDayExams = computed(() =>
    this.scheduledExams()
      .filter(
        (exam) => localDateKey(new Date(exam.schedule!.scheduledStart)) === this.selectedDate(),
      )
      .filter((exam) => this.modalityFilter() === 'ALL' || exam.modality === this.modalityFilter())
      .filter(
        (exam) =>
          this.stationFilter() === 'ALL' || exam.schedule!.stationAeTitle === this.stationFilter(),
      )
      .sort((left, right) =>
        left.schedule!.scheduledStart.localeCompare(right.schedule!.scheduledStart),
      ),
  );

  readonly selectedExam = computed(
    () => this.exams().find((exam) => exam.id === this.selectedExamId()) ?? null,
  );

  readonly filtersActive = computed(
    () => this.modalityFilter() !== 'ALL' || this.stationFilter() !== 'ALL',
  );

  readonly timeSlots = computed<TimeSlot[]>(() => {
    const slotTimes = new Set<string>();
    for (let hour = 8; hour < 18; hour++) {
      slotTimes.add(`${String(hour).padStart(2, '0')}:00`);
      slotTimes.add(`${String(hour).padStart(2, '0')}:30`);
    }
    for (const exam of this.filteredDayExams()) {
      slotTimes.add(this.slotKey(new Date(exam.schedule!.scheduledStart)));
    }

    const result: TimeSlot[] = [];
    for (const time of [...slotTimes].sort()) {
      const [hour, minute] = time.split(':').map(Number);
      const slotStart = new Date(`${this.selectedDate()}T${time}:00`);
      result.push({
        time,
        label: this.timeLabel(hour, minute),
        isPast: slotStart.getTime() <= Date.now(),
        exams: this.filteredDayExams().filter(
          (exam) => this.slotKey(new Date(exam.schedule!.scheduledStart)) === time,
        ),
      });
    }
    return result;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listExams().subscribe({
      next: (exams) => {
        this.exams.set(exams);
        const selected = this.selectedExamId();
        if (
          selected !== null &&
          !exams.some((exam) => exam.id === selected && exam.status === 'SCHEDULED')
        ) {
          this.selectedExamId.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Appointments could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  moveWeek(direction: -1 | 1): void {
    this.weekStart.set(this.addDays(this.weekStart(), direction * 7));
    this.selectedDate.set(this.addDaysKey(this.selectedDate(), direction * 7));
    this.selectedExamId.set(null);
  }

  goToToday(): void {
    const today = new Date();
    this.weekStart.set(this.startOfWeek(today));
    this.selectedDate.set(localDateKey(today));
    this.selectedExamId.set(null);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.key);
    this.selectedExamId.set(null);
  }

  appointmentCount(dateKey: string): number {
    return this.scheduledExams().filter(
      (exam) => localDateKey(new Date(exam.schedule!.scheduledStart)) === dateKey,
    ).length;
  }

  selectExam(exam: ExamView): void {
    this.selectedExamId.set(exam.id);
  }

  openSchedule(exam: ExamView | null = null, initialDate?: string, initialTime?: string): void {
    if (!this.canSchedule()) return;
    const isReschedule = exam?.status === 'SCHEDULED';
    const availableOrders = exam?.status === 'ORDERED' ? [exam] : this.orderedExams();
    if (!isReschedule && availableOrders.length === 0) {
      this.snackBar.open('There are no exam orders waiting to be scheduled.', 'Close', {
        duration: 3500,
      });
      return;
    }

    this.dialog
      .open(ScheduleFormDialog, {
        data: {
          exam: exam?.status === 'ORDERED' ? exam : isReschedule ? exam : null,
          orderedExams: availableOrders,
          initialDate,
          initialTime,
        },
        width: '620px',
        maxWidth: '95vw',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved?: ExamView) => {
        if (!saved) return;
        this.replaceExam(saved);
        this.selectedExamId.set(saved.id);
        if (saved.schedule) {
          const scheduledDate = new Date(saved.schedule.scheduledStart);
          this.weekStart.set(this.startOfWeek(scheduledDate));
          this.selectedDate.set(localDateKey(scheduledDate));
        }
        this.snackBar.open(isReschedule ? 'Appointment rescheduled.' : 'Exam scheduled.', 'Close', {
          duration: 3000,
        });
      });
  }

  confirmCancel(exam: ExamView): void {
    if (!this.canCancel()) return;
    this.dialog
      .open(CancelExamDialog, { data: exam, width: '460px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api.cancel(exam.id).subscribe({
          next: (cancelled) => {
            this.replaceExam(cancelled);
            if (this.selectedExamId() === exam.id) this.selectedExamId.set(null);
            this.snackBar.open('Exam cancelled and removed from the active schedule.', 'Close', {
              duration: 3500,
            });
          },
          error: (error: Error) =>
            this.snackBar.open(error.message || 'The exam could not be cancelled.', 'Close', {
              duration: 4500,
            }),
        });
      });
  }

  clearFilters(): void {
    this.modalityFilter.set('ALL');
    this.stationFilter.set('ALL');
  }

  patientLabel(exam: ExamView): string {
    return patientName(exam.patient);
  }

  modalityLabel(modality: Modality): string {
    return MODALITY_OPTIONS.find((option) => option.value === modality)?.label ?? modality;
  }

  appointmentLabel(exam: ExamView): string {
    const start = new Date(exam.schedule!.scheduledStart).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${start}, ${this.patientLabel(exam)}, ${exam.requestedProcedure}, ${exam.schedule!.stationAeTitle}`;
  }

  private replaceExam(updated: ExamView): void {
    this.exams.update((exams) => exams.map((exam) => (exam.id === updated.id ? updated : exam)));
  }

  private startOfWeek(value: Date): Date {
    const start = new Date(value);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private addDays(value: Date, days: number): Date {
    const result = new Date(value);
    result.setDate(result.getDate() + days);
    return result;
  }

  private addDaysKey(value: string, days: number): string {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return localDateKey(date);
  }

  private slotKey(value: Date): string {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  private timeLabel(hour: number, minute: number): string {
    const value = new Date(2000, 0, 1, hour, minute);
    return value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}
