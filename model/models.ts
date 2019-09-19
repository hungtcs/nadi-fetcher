
export type LevelTypes = '省级' | '地级' | '县级';

export class Area {
  public name: string;
  public code: string;
  public level: LevelTypes;

  constructor(partial: Partial<Area>) {
    Object.assign(this, partial);
  }

}