export interface IImpSection<TDataChildItem> {
  title: string;
  translationKey: string;
  defaultExpanded?: boolean;
  showMoreButton?: boolean;
  children?: IImpSectionItem<TDataChildItem>[];
}

export class ImpSection<TDataChildItem> {
  title: string;
  translationKey: string;
  expanded: boolean;
  showMoreButton: boolean;
  children: ImpSectionItem<TDataChildItem>[];

  constructor(newSection: IImpSection<TDataChildItem>) {
    this.title = newSection.title ?? '';
    this.translationKey = newSection.translationKey ?? ('' as string);
    this.expanded = localStorage.getItem(
      `${newSection.translationKey}_${SECTION_EXPANDED_KEY}`,
    )
      ? !!Number(
          localStorage.getItem(
            `${newSection.translationKey}_${SECTION_EXPANDED_KEY}`,
          ),
        )
      : (newSection.defaultExpanded ?? true);
    this.showMoreButton = newSection.showMoreButton ?? false;
    if (newSection.children && newSection.children.length > 0) {
      this.children = newSection.children.map((child) => ({
        visible: true,
        isShowMore: child.isShowMore ?? false,
        data: child.data,
      }));
    } else {
      this.children = [];
    }
  }
}

export const SECTION_EXPANDED_KEY = 'sectionExpanded';

export interface IImpSectionItem<TData> {
  isShowMore?: boolean;
  data: TData;
}

export class ImpSectionItem<TData> {
  visible: boolean;
  isShowMore: boolean;
  data: TData;

  constructor(newSectionItem: IImpSectionItem<TData>) {
    this.visible = true;
    this.isShowMore = newSectionItem.isShowMore ?? false;
    this.data = newSectionItem.data;
  }
}

export function getImpSections<TDataChild extends object>(
  sections: IImpSection<TDataChild>[],
  translation: Partial<{
    [key: string]: { title: string };
  }>,
): ImpSection<TDataChild>[] {
  return sections.map((section) =>
    getImpSection(section, translation[section.translationKey]),
  );
}

export function getImpSection<TDataChild extends object>(
  section: IImpSection<TDataChild>,
  translation?: { title: string },
) {
  return new ImpSection({
    ...section,
    title: translation?.title ?? section.title,
  });
}
