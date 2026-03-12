import {
  DashboardWidget,
  DEFAULT_WIDGETS,
  MAX_WIDGETS,
  isValidWidgetType,
  isValidWidgetPosition,
} from '../value-objects/DashboardWidget'

export interface DashboardLayoutProps {
  id: string
  userId: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export class DashboardLayout {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _name: string,
    private _widgets: DashboardWidget[],
    private _isDefault: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: {
    userId: string
    name: string
    widgets?: DashboardWidget[]
  }): DashboardLayout {
    DashboardLayout.validateName(props.name)

    const widgets = props.widgets ?? DEFAULT_WIDGETS
    DashboardLayout.validateWidgets(widgets)

    return new DashboardLayout(
      crypto.randomUUID(),
      props.userId,
      props.name.trim(),
      widgets,
      true,
      new Date(),
      new Date()
    )
  }

  static restore(props: DashboardLayoutProps): DashboardLayout {
    return new DashboardLayout(
      props.id,
      props.userId,
      props.name,
      props.widgets,
      props.isDefault,
      props.createdAt,
      props.updatedAt
    )
  }

  updateWidgets(widgets: DashboardWidget[]): DashboardLayout {
    DashboardLayout.validateWidgets(widgets)

    return new DashboardLayout(
      this._id,
      this._userId,
      this._name,
      widgets,
      this._isDefault,
      this._createdAt,
      new Date()
    )
  }

  addWidget(widget: DashboardWidget): DashboardLayout {
    if (!isValidWidgetType(widget.type)) {
      throw new Error(`유효하지 않은 위젯 타입입니다: ${widget.type}`)
    }
    if (!isValidWidgetPosition(widget.position)) {
      throw new Error('유효하지 않은 위젯 위치입니다')
    }
    return this.updateWidgets([...this._widgets, widget])
  }

  removeWidget(widgetId: string): DashboardLayout {
    const filtered = this._widgets.filter((w) => w.id !== widgetId)
    if (filtered.length === this._widgets.length) {
      throw new Error(`위젯을 찾을 수 없습니다: ${widgetId}`)
    }
    return new DashboardLayout(
      this._id,
      this._userId,
      this._name,
      filtered,
      this._isDefault,
      this._createdAt,
      new Date()
    )
  }

  rename(name: string): DashboardLayout {
    DashboardLayout.validateName(name)

    return new DashboardLayout(
      this._id,
      this._userId,
      name.trim(),
      this._widgets,
      this._isDefault,
      this._createdAt,
      new Date()
    )
  }

  setDefault(isDefault: boolean): DashboardLayout {
    return new DashboardLayout(
      this._id,
      this._userId,
      this._name,
      this._widgets,
      isDefault,
      this._createdAt,
      new Date()
    )
  }

  // ─── Getters ─────────────────────────────────

  get id(): string {
    return this._id
  }
  get userId(): string {
    return this._userId
  }
  get name(): string {
    return this._name
  }
  get widgets(): DashboardWidget[] {
    return [...this._widgets]
  }
  get isDefault(): boolean {
    return this._isDefault
  }
  get createdAt(): Date {
    return new Date(this._createdAt)
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }
  get widgetCount(): number {
    return this._widgets.length
  }

  // ─── Validation ──────────────────────────────

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('레이아웃 이름은 필수입니다')
    }
    if (name.trim().length > 100) {
      throw new Error('레이아웃 이름은 100자 이하여야 합니다')
    }
  }

  private static validateWidgets(widgets: DashboardWidget[]): void {
    if (widgets.length > MAX_WIDGETS) {
      throw new Error(`위젯은 최대 ${MAX_WIDGETS}개까지 추가 가능합니다`)
    }

    const ids = widgets.map((w) => w.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      throw new Error('위젯 ID가 중복됩니다')
    }

    for (const widget of widgets) {
      if (!isValidWidgetType(widget.type)) {
        throw new Error(`유효하지 않은 위젯 타입입니다: ${widget.type}`)
      }
      if (!isValidWidgetPosition(widget.position)) {
        throw new Error(`유효하지 않은 위젯 위치입니다: ${widget.id}`)
      }
    }
  }

  // ─── Serialization ───────────────────────────

  toJSON(): DashboardLayoutProps {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      widgets: this._widgets,
      isDefault: this._isDefault,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
