export default class HackyDate {
    public date: Date;

    constructor(milliseconds) {
        this.date = new window.__oldDate(
            new window.__oldDate().getTime() + milliseconds
        );
    }

    public now() {
        return this.date.getTime();
    }
}
