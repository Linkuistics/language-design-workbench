pub struct EnumRule {
    pub r#members: Vec<()>,
}

pub struct SeparatedByRule {
    pub r#element: RuleElement,
    pub r#separator: String,
    pub r#minCount: u8,
}
