import { default as discourseComputed, on, observes } from 'discourse-common/utils/decorators';
import { eventsForDay } from '../lib/date-utilities';
import { gt, notEmpty, equal } from "@ember/object/computed";
import { bind } from "@ember/runloop";
import Component from "@ember/component";
import { htmlSafe } from "@ember/template";
import { getOwner } from 'discourse-common/lib/get-owner';
import { default as Composer } from 'discourse/models/composer';

const MAX_EVENTS = 4;

export default Component.extend({
  classNameBindings: [':day', 'classes', 'differentMonth'],
  hidden: 0,
  hasHidden: gt('hidden', 0),

  @discourseComputed('date', 'month', 'expandedDate')
  expanded(date, month, expandedDate) {
    return `${month}.${date}` === expandedDate;
  },

  @discourseComputed('month', 'currentMonth')
  differentMonth(month, currentMonth) {
    return month !== currentMonth
  },

  @on('init')
  @observes('expanded')
  setEvents() {
    const expanded = this.get('expanded');
    const allEvents = this.get('allEvents');
    let events = $.extend([], allEvents);

    if (events.length && !expanded) {
      let hidden = events.splice(MAX_EVENTS);

      if (hidden.length) {
        this.set('hidden', hidden.length);
      }
    } else {
      this.set('hidden', 0);
    }

    this.set("events", events);
  },

  @discourseComputed('day', 'topics.[]', 'expanded', 'rowIndex')
  allEvents(day, topics, expanded, rowIndex) {
    return eventsForDay(day, topics, { rowIndex, expanded });
  },

  @discourseComputed('index')
  rowIndex(index) {
    return index % 7;
  },

  didInsertElement() {
    this.set('clickHandler', bind(this, this.documentClick));
    $(document).on('click', this.get('clickHandler'));
  },

  willDestroyElement() {
    $(document).off('click', this.get('clickHandler'));
  },

  documentClick(event) {
    let $element = this.$();
    let $target = $(event.target);

    if (!$target.closest($element).length) {
      this.clickOutside();
    }
  },

  clickOutside() {
    if (this.get('expanded')) {
      this.get('setExpandedDate')(null);
    }
  },

  click() {

    const composer = getOwner(this).lookup('controller:composer');
    composer.open({
      action: Composer.CREATE_TOPIC,
      draftKey: Composer.DRAFT,
      title: "Pre-filled topic title!",
      topicBody: "Pre-filled topic body goes here"
    });

    console.log(this.get('category_id'), this.get('buffered.category_id'));
    //Category.findById(this.get('buffered.category_id')

    const canSelectDate = this.get('canSelectDate');
    if (canSelectDate) {
      const date = this.get('date');
      const month = this.get('month');
      this.sendAction('selectDate', date, month);
    }
  },

  @discourseComputed('index')
  date() {
    const day = this.get('day');
    return day.date();
  },

  @discourseComputed('index')
  month() {
    const day = this.get('day');
    return day.month();
  },

  @discourseComputed('day', 'currentDate', 'currentMonth', 'expanded', 'responsive')
  classes(day, currentDate, currentMonth, expanded, responsive) {
    let classes = '';
    if (day.isSame(moment(), "day")) {
      classes += 'today ';
    }
    if (responsive && day.isSame(moment().month(currentMonth).date(currentDate), "day")) {
      classes += 'selected ';
    }
    if (expanded) {
      classes += 'expanded';
    }
    return classes;
  },

  @discourseComputed('expanded')
  containerStyle(expanded) {
    let style = '';

    if (expanded) {
      const offsetLeft = this.$().offset().left;
      const offsetTop = this.$().offset().top;
      const windowWidth = $(window).width();
      const windowHeight = $(window).height();

      if (offsetLeft > (windowWidth / 2)) {
        style += 'right:0;';
      } else {
        style += 'left:0;';
      }

      if (offsetTop > (windowHeight / 2)) {
        style += 'bottom:0;';
      } else {
        style += 'top:0;';
      }
    }

    return htmlSafe(style);
  }
});
